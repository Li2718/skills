import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const DEFAULT_LEASE_MS = 30 * 60 * 1000;
export const INITIALIZATION_GRACE_MS = 30 * 1000;
const DEFAULT_POLL_MS = 2 * 1000;
const WAIT_LOG_INTERVAL_MS = 30 * 1000;
const LOCK_REF_PREFIX = "refs/worktree-workflow/locks/";
const MAX_CAS_ATTEMPTS = 20;

export class LockConflictError extends Error {
  constructor(conflict) {
    super(`worktree is locked by ${conflict.owner ?? "an unknown owner"}: ${conflict.worktree}`);
    this.name = "LockConflictError";
    this.conflict = conflict;
  }
}

function canonicalPath(value) {
  return fs.realpathSync.native(path.resolve(value));
}

function pathKey(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function normalizedPath(value) {
  return pathKey(canonicalPath(value));
}

function leasePathKey(value) {
  const resolved = path.resolve(value);
  return fs.existsSync(resolved) ? normalizedPath(resolved) : pathKey(resolved);
}

function lockRef(worktree) {
  const key = crypto.createHash("sha256").update(normalizedPath(worktree)).digest("hex");
  return `${LOCK_REF_PREFIX}${key}`;
}

function runGitDir(lockRoot, args, options = {}) {
  return execFileSync("git", ["--git-dir", lockRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  }).trim();
}

function runGitDirResult(lockRoot, args) {
  return spawnSync("git", ["--git-dir", lockRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
  });
}

function readRef(lockRoot, ref) {
  const result = runGitDirResult(lockRoot, ["rev-parse", "--verify", "--quiet", ref]);
  if (result.status === 0) return result.stdout.trim();
  if (result.status === 1) return null;
  try {
    const oid = fs.readFileSync(path.join(lockRoot, ...ref.split("/")), "utf8").trim();
    if (/^[0-9a-f]{40}$|^[0-9a-f]{64}$/.test(oid)) return oid;
  } catch {
    // Fall through to the Git error below.
  }
  throw new Error(result.stderr.trim() || `failed to read ${ref}`);
}

function writeRecord(lockRoot, record) {
  return runGitDir(lockRoot, ["hash-object", "-w", "--stdin"], {
    input: `${JSON.stringify(record)}\n`,
  });
}

function readRecord(lockRoot, oid) {
  try {
    const record = JSON.parse(runGitDir(lockRoot, ["cat-file", "blob", oid]));
    const error = validateRecord(record);
    return error ? { invalid: true, error } : record;
  } catch (error) {
    return { invalid: true, error: error.message };
  }
}

function validateRecord(record) {
  if (!record || record.version !== 1) return "unsupported or missing record version";
  if (typeof record.owner !== "string" || !record.owner.trim()) return "missing owner";
  if (typeof record.token !== "string" || !record.token) return "missing token";
  if (typeof record.worktree !== "string" || !record.worktree) return "missing worktree";
  if (!Number.isFinite(record.expiresAtMs)) return "invalid expiry";
  return null;
}

function compareAndSwap(lockRoot, ref, newOid, oldOid) {
  const expected = oldOid ?? "0".repeat(newOid.length);
  const result = runGitDirResult(lockRoot, [
    "update-ref",
    "--create-reflog",
    ref,
    newOid,
    expected,
  ]);
  return result.status === 0;
}

function compareAndDelete(lockRoot, ref, oldOid) {
  return runGitDirResult(lockRoot, ["update-ref", "-d", ref, oldOid]).status === 0;
}

function refUpdatedAt(lockRoot, ref) {
  for (const candidate of [
    path.join(lockRoot, ...ref.split("/")),
    path.join(lockRoot, "logs", ...ref.split("/")),
  ]) {
    try {
      return fs.statSync(candidate).mtimeMs;
    } catch {
      // Try the next repository-owned timestamp source.
    }
  }
  const reflog = runGitDirResult(lockRoot, ["reflog", "show", "-1", "--format=%ct", ref]);
  const seconds = Number(reflog.stdout.trim());
  if (reflog.status === 0 && Number.isFinite(seconds)) return seconds * 1000;
  return 0;
}

function readLease(lockRoot, worktree) {
  const ref = lockRef(worktree);
  const oid = readRef(lockRoot, ref);
  if (!oid) return { ref, oid: null, record: null, updatedAtMs: 0 };
  return {
    ref,
    oid,
    record: readRecord(lockRoot, oid),
    updatedAtMs: refUpdatedAt(lockRoot, ref),
  };
}

function isExpired(record, now) {
  return !record?.invalid && Number.isFinite(record?.expiresAtMs) && record.expiresAtMs <= now;
}

function createRecord({ owner, token, worktree, leaseMs, now, acquiredAt }) {
  return {
    version: 1,
    owner,
    token,
    worktree: canonicalPath(worktree),
    acquiredAt: acquiredAt ?? new Date(now).toISOString(),
    renewedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + leaseMs).toISOString(),
    expiresAtMs: now + leaseMs,
  };
}

function renewRecord(record, leaseMs, now) {
  return {
    ...record,
    renewedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + leaseMs).toISOString(),
    expiresAtMs: now + leaseMs,
  };
}

function publicRecord(record, state, worktree) {
  if (!record) return { state: "unlocked", worktree };
  if (record.invalid) return { state: "invalid", worktree, error: record.error };
  return {
    state,
    owner: record.owner,
    tokenPrefix: record.token.slice(0, 8),
    worktree: record.worktree,
    acquiredAt: record.acquiredAt,
    renewedAt: record.renewedAt,
    expiresAt: record.expiresAt,
  };
}

function tryAcquireOne({ lockRoot, owner, token, worktree, leaseMs, now }) {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const current = readLease(lockRoot, worktree);
    let acquiredAt;
    let created = false;

    if (!current.record) {
      created = true;
    } else if (current.record.token === token) {
      if (isExpired(current.record, now)) {
        throw new Error(`lease expired before renewal: ${worktree}`);
      }
      acquiredAt = current.record.acquiredAt;
    } else if (isExpired(current.record, now)) {
      created = true;
    } else if (current.record.invalid && now - current.updatedAtMs > INITIALIZATION_GRACE_MS) {
      created = true;
    } else {
      throw new LockConflictError({
        ...publicRecord(current.record, "active", canonicalPath(worktree)),
        worktree: current.record.worktree ?? canonicalPath(worktree),
      });
    }

    const record = createRecord({ owner, token, worktree, leaseMs, now, acquiredAt });
    const oid = writeRecord(lockRoot, record);
    if (compareAndSwap(lockRoot, current.ref, oid, current.oid)) {
      return { ref: current.ref, oid, record, created };
    }
  }
  throw new Error(`lock state changed too frequently: ${worktree}`);
}

function uniqueWorktrees(worktrees) {
  if (!Array.isArray(worktrees) || worktrees.length === 0) {
    throw new Error("at least one worktree is required");
  }
  return [...new Map(worktrees.map((item) => [normalizedPath(item), canonicalPath(item)])).values()]
    .sort((left, right) => normalizedPath(left).localeCompare(normalizedPath(right)));
}

function releaseOwnedRef(lockRoot, ref, token) {
  for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt += 1) {
    const oid = readRef(lockRoot, ref);
    if (!oid) return null;
    const record = readRecord(lockRoot, oid);
    if (record?.token !== token) return null;
    if (compareAndDelete(lockRoot, ref, oid)) return record.worktree;
  }
  throw new Error(`lock state changed too frequently: ${ref}`);
}

export function tryAcquireGroup({
  lockRoot,
  owner,
  token = crypto.randomUUID(),
  worktrees,
  leaseMs = DEFAULT_LEASE_MS,
  now = Date.now(),
}) {
  if (typeof owner !== "string" || !owner.trim()) throw new Error("--owner is required");
  if (!Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new Error("lease must be a positive number of milliseconds");
  }

  const created = [];
  const records = [];
  try {
    for (const worktree of uniqueWorktrees(worktrees)) {
      const acquired = tryAcquireOne({
        lockRoot,
        owner: owner.trim(),
        token,
        worktree,
        leaseMs,
        now,
      });
      records.push(acquired.record);
      if (acquired.created) created.push(acquired.ref);
    }
    return { token, records };
  } catch (error) {
    const rollbackFailures = [];
    for (const ref of created.reverse()) {
      try {
        releaseOwnedRef(lockRoot, ref, token);
      } catch (rollbackError) {
        rollbackFailures.push(rollbackError);
      }
    }
    if (rollbackFailures.length > 0) {
      throw new AggregateError([error, ...rollbackFailures], "group acquisition failed and rollback was incomplete");
    }
    throw error;
  }
}

function listLockRefs(lockRoot) {
  const output = runGitDir(lockRoot, ["for-each-ref", "--format=%(refname)", LOCK_REF_PREFIX]);
  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

export function renewToken({ lockRoot, token, leaseMs = DEFAULT_LEASE_MS, now = Date.now() }) {
  if (!token) throw new Error("--token is required");
  const entries = listLockRefs(lockRoot)
    .map((ref) => {
      const oid = readRef(lockRoot, ref);
      return { ref, oid, record: oid ? readRecord(lockRoot, oid) : null };
    })
    .filter(({ record }) => record?.token === token);
  if (entries.length === 0) throw new Error("no worktree locks found for token");
  if (entries.some(({ record }) => isExpired(record, now))) {
    throw new Error("lease has expired; acquire the worktree locks again before making changes");
  }

  return entries.map(({ ref, oid, record }) => {
    const renewed = renewRecord(record, leaseMs, now);
    const renewedOid = writeRecord(lockRoot, renewed);
    if (!compareAndSwap(lockRoot, ref, renewedOid, oid)) {
      throw new Error(`lease changed during renewal: ${record.worktree}`);
    }
    return renewed;
  });
}

export function releaseToken({ lockRoot, token, worktrees }) {
  if (!token) throw new Error("--token is required");
  const selected = Array.isArray(worktrees) && worktrees.length > 0
    ? new Set(worktrees.map(leasePathKey))
    : null;
  const entries = listLockRefs(lockRoot).map((ref) => {
    const oid = readRef(lockRoot, ref);
    return { ref, record: oid ? readRecord(lockRoot, oid) : null };
  });
  const owned = entries.filter(({ record }) => record?.token === token && record.worktree);
  if (selected) {
    const held = new Set(owned.map(({ record }) => leasePathKey(record.worktree)));
    const missing = [...selected].filter((worktree) => !held.has(worktree));
    if (missing.length > 0) {
      throw new Error(`token does not hold requested worktree locks: ${missing.join(", ")}`);
    }
  }
  const released = [];
  for (const { ref, record } of owned) {
    if (selected && !selected.has(leasePathKey(record.worktree))) continue;
    const worktree = releaseOwnedRef(lockRoot, ref, token);
    if (worktree) released.push(worktree);
  }
  return released;
}

export function lockStatus({ lockRoot, worktrees, now = Date.now() }) {
  return uniqueWorktrees(worktrees).map((worktree) => {
    const { record } = readLease(lockRoot, worktree);
    return publicRecord(record, isExpired(record, now) ? "expired" : "active", worktree);
  });
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

export function repositoryContext(cwd = process.cwd()) {
  const commonDir = canonicalPath(path.resolve(cwd, runGit(["rev-parse", "--git-common-dir"], cwd)));
  const currentWorktree = canonicalPath(runGit(["rev-parse", "--show-toplevel"], cwd));
  const registeredWorktrees = runGit(["worktree", "list", "--porcelain", "-z"], cwd)
    .split("\0")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => canonicalPath(line.slice("worktree ".length)));
  return {
    commonDir,
    currentWorktree,
    mainWorktree: registeredWorktrees[0],
    registeredWorktrees,
    lockRoot: commonDir,
  };
}

export function resolveTargets(context, values, includeMain, cwd = process.cwd()) {
  const requested = values.length === 0 && !includeMain
    ? [context.currentWorktree]
    : values.map((item) => path.resolve(cwd, item));
  if (includeMain) requested.push(context.mainWorktree);
  const registered = new Map(context.registeredWorktrees.map((item) => [normalizedPath(item), item]));
  return [...new Map(requested.map((item) => {
    const key = normalizedPath(item);
    const worktree = registered.get(key);
    if (!worktree) throw new Error(`not a registered git worktree: ${item}`);
    return [key, worktree];
  })).values()];
}

function resolveReleaseTargets(context, values, includeMain, cwd = process.cwd()) {
  const requested = values.map((item) => path.resolve(cwd, item));
  if (includeMain) requested.push(context.mainWorktree);
  return [...new Map(requested.map((item) => [leasePathKey(item), item])).values()];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function acquireWithWait({
  lockRoot,
  owner,
  token,
  worktrees,
  leaseMs = DEFAULT_LEASE_MS,
  wait = false,
  pollMs = DEFAULT_POLL_MS,
  timeoutMs = 0,
  onWait,
}) {
  const startedAt = Date.now();
  for (;;) {
    try {
      return tryAcquireGroup({ lockRoot, owner, token, worktrees, leaseMs });
    } catch (error) {
      if (!(error instanceof LockConflictError) || !wait) throw error;
      const elapsed = Date.now() - startedAt;
      if (timeoutMs > 0 && elapsed >= timeoutMs) {
        throw new Error(`timed out waiting for ${error.conflict.worktree}`);
      }
      onWait?.(error.conflict, elapsed);
      await sleep(pollMs);
    }
  }
}

function parseInteger(value, flag, allowZero = false) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < (allowZero ? 0 : 1)) {
    throw new Error(`${flag} must be ${allowZero ? "a non-negative" : "a positive"} integer`);
  }
  return number;
}

function parseArgs(argv) {
  const command = argv[0];
  const options = {
    worktrees: [],
    main: false,
    wait: false,
    leaseMs: DEFAULT_LEASE_MS,
    pollMs: DEFAULT_POLL_MS,
    timeoutMs: 0,
  };
  if (command === "--help" || command === "-h") {
    options.help = true;
    return { command: null, options };
  }
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--owner") options.owner = argv[++index];
    else if (arg === "--token") options.token = argv[++index];
    else if (arg === "--worktree") options.worktrees.push(argv[++index]);
    else if (arg === "--main") options.main = true;
    else if (arg === "--wait") options.wait = true;
    else if (arg === "--lease-ms") options.leaseMs = parseInteger(argv[++index], arg);
    else if (arg === "--poll-ms") options.pollMs = parseInteger(argv[++index], arg);
    else if (arg === "--timeout-ms") options.timeoutMs = parseInteger(argv[++index], arg, true);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return { command, options };
}

function usage() {
  return `Usage:
  node <skill-root>/scripts/worktree-lock.mjs acquire --owner <task> [--worktree <path>] [--main] [--wait]
  node <skill-root>/scripts/worktree-lock.mjs renew --token <token> [--lease-ms <ms>]
  node <skill-root>/scripts/worktree-lock.mjs status [--worktree <path>] [--main]
  node <skill-root>/scripts/worktree-lock.mjs release --token <token> [--worktree <path>] [--main]

Defaults: current worktree, 30-minute lease, 2-second polling, unlimited wait. A zero timeout means unlimited wait.`;
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help || !command) {
    console.log(usage());
    return;
  }
  const context = repositoryContext();

  if (command === "acquire") {
    const worktrees = resolveTargets(context, options.worktrees, options.main);
    let lastLogAt = 0;
    const result = await acquireWithWait({
      lockRoot: context.lockRoot,
      owner: options.owner,
      token: options.token,
      worktrees,
      leaseMs: options.leaseMs,
      wait: options.wait,
      pollMs: options.pollMs,
      timeoutMs: options.timeoutMs,
      onWait(conflict) {
        if (Date.now() - lastLogAt >= WAIT_LOG_INTERVAL_MS) {
          process.stderr.write(`[worktree-lock] waiting for ${conflict.worktree} (${conflict.owner ?? "unknown owner"})\n`);
          lastLogAt = Date.now();
        }
      },
    });
    console.log(JSON.stringify({
      token: result.token,
      owner: options.owner,
      leaseMs: options.leaseMs,
      worktrees: result.records.map((record) => record.worktree),
      expiresAt: result.records[0]?.expiresAt,
    }, null, 2));
  } else if (command === "renew") {
    const records = renewToken({ lockRoot: context.lockRoot, token: options.token, leaseMs: options.leaseMs });
    console.log(JSON.stringify({
      renewed: records.map((record) => record.worktree),
      expiresAt: records[0]?.expiresAt,
    }, null, 2));
  } else if (command === "status") {
    const worktrees = resolveTargets(context, options.worktrees, options.main);
    console.log(JSON.stringify(lockStatus({ lockRoot: context.lockRoot, worktrees }), null, 2));
  } else if (command === "release") {
    const selected = options.worktrees.length > 0 || options.main
      ? resolveReleaseTargets(context, options.worktrees, options.main)
      : undefined;
    console.log(JSON.stringify({
      released: releaseToken({ lockRoot: context.lockRoot, token: options.token, worktrees: selected }),
    }, null, 2));
  } else {
    throw new Error(`unknown command: ${command}`);
  }
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntryPoint) {
  main().catch((error) => {
    console.error(`[worktree-lock] ${error.message}`);
    process.exitCode = 1;
  });
}
