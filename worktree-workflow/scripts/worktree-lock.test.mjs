import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  acquireWithWait,
  INITIALIZATION_GRACE_MS,
  lockStatus,
  releaseToken,
  renewToken,
  repositoryContext,
  tryAcquireGroup,
} from "./worktree-lock.mjs";

const scriptPath = fileURLToPath(new URL("./worktree-lock.mjs", import.meta.url));

function directoryFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-lock-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const commonDir = path.join(root, "common.git");
  runGit(root, ["init", "--bare", commonDir]);
  const lockRoot = commonDir;
  const first = path.join(root, "first");
  const second = path.join(root, "second");
  fs.mkdirSync(first);
  fs.mkdirSync(second);
  return { root, lockRoot, first, second };
}

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

function runGitStore(lockRoot, args, options = {}) {
  return execFileSync("git", ["--git-dir", lockRoot, ...args], {
    encoding: "utf8",
    windowsHide: true,
    ...options,
  }).trim();
}

function runCliAsync(cwd, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function repositoryFixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-lock-repo-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const repository = path.join(root, "repository");
  const feature = path.join(root, "feature");
  fs.mkdirSync(repository);
  runGit(repository, ["init", "--initial-branch=main"]);
  fs.writeFileSync(path.join(repository, "tracked.txt"), "initial\n");
  runGit(repository, ["add", "tracked.txt"]);
  runGit(repository, ["-c", "user.name=Worktree Lock Test", "-c", "user.email=lock@example.invalid", "commit", "-m", "initial"]);
  runGit(repository, ["worktree", "add", "-b", "feature", feature]);
  return { root, repository, feature };
}

test("all worktrees resolve one lock root in the Git common directory", (t) => {
  const { repository, feature } = repositoryFixture(t);
  const mainContext = repositoryContext(repository);
  const featureContext = repositoryContext(feature);

  assert.equal(mainContext.commonDir, featureContext.commonDir);
  assert.equal(mainContext.lockRoot, featureContext.lockRoot);
  assert.equal(mainContext.lockRoot, mainContext.commonDir);
  assert.equal(featureContext.currentWorktree, fs.realpathSync.native(feature));
});

test("the CLI supports acquire, status, renew, and release", (t) => {
  const { feature } = repositoryFixture(t);
  const run = (...args) => JSON.parse(execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: feature,
    encoding: "utf8",
    windowsHide: true,
  }));

  const acquired = run("acquire", "--owner", "cli task", "--token", "cli-token", "--lease-ms", "10000");
  assert.equal(acquired.owner, "cli task");
  assert.deepEqual(run("status").map((record) => record.owner), ["cli task"]);
  assert.equal(run("renew", "--token", "cli-token", "--lease-ms", "20000").renewed.length, 1);
  assert.equal(run("release", "--token", "cli-token").released.length, 1);
  assert.deepEqual(run("status").map((record) => record.state), ["unlocked"]);
});

test("one worktree lease is mutually exclusive and a conflict preserves the valid owner", (t) => {
  const { lockRoot, first } = directoryFixture(t);
  tryAcquireGroup({ lockRoot, owner: "codex task", token: "token-a", worktrees: [first], now: 1_000 });

  assert.throws(
    () => tryAcquireGroup({ lockRoot, owner: "claude task", token: "token-b", worktrees: [first], now: 2_000 }),
    /locked by codex task/,
  );
  assert.equal(lockStatus({ lockRoot, worktrees: [first], now: 2_000 })[0].owner, "codex task");
});

test("multi-worktree acquisition rolls back locks obtained in the failed attempt", (t) => {
  const { repository, feature } = repositoryFixture(t);
  const { lockRoot } = repositoryContext(feature);
  tryAcquireGroup({ lockRoot, owner: "existing", token: "existing-token", worktrees: [repository], now: 1_000 });

  assert.throws(
    () => tryAcquireGroup({
      lockRoot,
      owner: "merge",
      token: "merge-token",
      worktrees: [feature, repository],
      now: 2_000,
    }),
    /locked by existing/,
  );
  assert.equal(lockStatus({ lockRoot, worktrees: [feature], now: 2_000 })[0].state, "unlocked");
  assert.equal(lockStatus({ lockRoot, worktrees: [repository], now: 2_000 })[0].owner, "existing");
});

test("waiting acquisition does not bypass an active owner", async (t) => {
  const { lockRoot, first } = directoryFixture(t);
  tryAcquireGroup({ lockRoot, owner: "first", token: "first-token", worktrees: [first] });
  const waiter = acquireWithWait({
    lockRoot,
    owner: "second",
    token: "second-token",
    worktrees: [first],
    wait: true,
    pollMs: 5,
    timeoutMs: 1_000,
  });
  setTimeout(() => releaseToken({ lockRoot, token: "first-token" }), 25);

  const acquired = await waiter;
  assert.equal(acquired.records[0].owner, "second");
});

test("renew extends every lease held by a token", (t) => {
  const { lockRoot, first, second } = directoryFixture(t);
  tryAcquireGroup({
    lockRoot,
    owner: "merge",
    token: "merge-token",
    worktrees: [first, second],
    leaseMs: 100,
    now: 1_000,
  });

  const renewed = renewToken({ lockRoot, token: "merge-token", leaseMs: 500, now: 1_050 });
  assert.equal(renewed.length, 2);
  assert.deepEqual(renewed.map((record) => record.expiresAtMs), [1_550, 1_550]);
});

test("release removes only locks held by its token", (t) => {
  const { lockRoot, first, second } = directoryFixture(t);
  tryAcquireGroup({ lockRoot, owner: "first", token: "first-token", worktrees: [first], now: 1_000 });
  tryAcquireGroup({ lockRoot, owner: "second", token: "second-token", worktrees: [second], now: 1_000 });

  assert.deepEqual(releaseToken({ lockRoot, token: "unknown-token" }), []);
  assert.deepEqual(releaseToken({ lockRoot, token: "first-token" }), [first]);
  assert.deepEqual(
    lockStatus({ lockRoot, worktrees: [first, second], now: 2_000 }).map((record) => record.state),
    ["unlocked", "active"],
  );
});

test("expired leases are reclaimed and cannot be renewed", (t) => {
  const { lockRoot, first } = directoryFixture(t);
  tryAcquireGroup({ lockRoot, owner: "stale", token: "stale-token", worktrees: [first], leaseMs: 100, now: 1_000 });
  assert.throws(
    () => renewToken({ lockRoot, token: "stale-token", leaseMs: 100, now: 1_101 }),
    /lease has expired/,
  );

  const current = tryAcquireGroup({
    lockRoot,
    owner: "current",
    token: "current-token",
    worktrees: [first],
    leaseMs: 100,
    now: 1_101,
  });
  assert.equal(current.records[0].owner, "current");
});

test("concurrent expired-lease reclaim preserves the winning new lease", async (t) => {
  const { feature } = repositoryFixture(t);
  const { lockRoot } = repositoryContext(feature);
  tryAcquireGroup({
    lockRoot,
    owner: "expired",
    token: "expired-token",
    worktrees: [feature],
    leaseMs: 100,
    now: 1_000,
  });

  const contenders = await Promise.all([
    runCliAsync(feature, ["acquire", "--owner", "contender-a", "--token", "contender-a-token"]),
    runCliAsync(feature, ["acquire", "--owner", "contender-b", "--token", "contender-b-token"]),
  ]);
  assert.equal(contenders.filter((result) => result.code === 0).length, 1);
  assert.equal(contenders.filter((result) => result.code !== 0).length, 1);

  const winner = JSON.parse(contenders.find((result) => result.code === 0).stdout);
  const status = JSON.parse(execFileSync(process.execPath, [scriptPath, "status"], {
    cwd: feature,
    encoding: "utf8",
    windowsHide: true,
  }));
  assert.equal(status[0].state, "active");
  assert.equal(status[0].owner, winner.owner);
});

function replaceRefRecord(lockRoot, ref, oldOid, contents) {
  const oid = runGitStore(lockRoot, ["hash-object", "-w", "--stdin"], { input: contents });
  runGitStore(lockRoot, ["update-ref", "--create-reflog", ref, oid, oldOid]);
}

const damageScenarios = [
  ["missing record object", ({ lockRoot, oldOid }) => {
    fs.rmSync(path.join(lockRoot, "objects", oldOid.slice(0, 2), oldOid.slice(2)));
  }],
  ["malformed record", ({ lockRoot, ref, oldOid }) => {
    replaceRefRecord(lockRoot, ref, oldOid, "{broken json");
  }],
  ["schema-invalid record", ({ lockRoot, ref, oldOid }) => {
    replaceRefRecord(lockRoot, ref, oldOid, JSON.stringify({
      version: 1,
      owner: "initial",
      token: "initial-token",
      worktree: "invalid",
      expiresAtMs: "never",
    }));
  }],
];

for (const [name, damage] of damageScenarios) {
  test(`${name} is preserved during its grace period and recovered afterward`, (t) => {
    const { lockRoot, first } = directoryFixture(t);
    tryAcquireGroup({ lockRoot, owner: "initial", token: "initial-token", worktrees: [first], now: 1_000 });
    const ref = runGitStore(lockRoot, ["for-each-ref", "--format=%(refname)", "refs/worktree-workflow/locks/"]);
    const oldOid = runGitStore(lockRoot, ["rev-parse", "--verify", ref]);
    damage({ lockRoot, ref, oldOid });
    const observedAt = Date.now();

    assert.throws(
      () => tryAcquireGroup({
        lockRoot,
        owner: "too early",
        token: "early-token",
        worktrees: [first],
        now: observedAt,
      }),
      /locked by an unknown owner/,
    );

    const recovered = tryAcquireGroup({
      lockRoot,
      owner: "recovered",
      token: "recovered-token",
      worktrees: [first],
      now: observedAt + INITIALIZATION_GRACE_MS + 2_000,
    });
    assert.equal(recovered.records[0].owner, "recovered");
  });
}
