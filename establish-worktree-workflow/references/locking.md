# Repository worktree locks

Use [worktree-lock.mjs](../scripts/worktree-lock.mjs) through Node.js. Resolve the script path from this canonical skill directory.

## Commands

```text
node <skill-root>/scripts/worktree-lock.mjs acquire --owner <task> [--worktree <path>] [--main] [--wait] [--timeout-ms <ms>]
node <skill-root>/scripts/worktree-lock.mjs renew --token <token> [--lease-ms <ms>]
node <skill-root>/scripts/worktree-lock.mjs status [--worktree <path>] [--main]
node <skill-root>/scripts/worktree-lock.mjs release --token <token> [--worktree <path>] [--main]
```

`acquire` defaults to the current worktree. Repeat `--worktree` to request a group and add `--main` to include the repository's primary worktree. Use one human-readable owner for the current task. Keep the returned token and canonical worktree identities for renew, cleanup recovery, and release; do not discover ownership through Codex, Claude, or another tool's session state. On `release`, selectors drop only those group members; omitting selectors releases the entire token. After a target disappears, select it by the canonical identity returned at acquisition or persisted in the cleanup receipt, not by an unresolved path alias.

## Mutation protocol

1. Determine every registered worktree whose tracked files, index, HEAD, refs, or checked-out branch may change.
2. Acquire all targets in one command with `--wait`. For integration, include both the source and target worktrees.
3. Treat acquisition failure or timeout as a stop condition. Never remove, rewrite, or bypass another token's valid lease.
4. Renew with the token immediately before each state-changing command and often enough that the lease remains valid throughout longer operations. Stop if renewal fails.
5. After removing a worktree, keep renewing from the stored lease record rather than resolving the deleted path. Selectively release the removed target when later phases still need another group member.
6. Validate that the token owns every explicitly selected release target before changing any lease. Release the remaining token after the protected operation and its rollback or cleanup finish.

The runtime stores lease records as Git blobs referenced from a private ref namespace in the Git common directory, so every worktree, Codex session, and Claude session observes the same state. Every acquire, renew, release, and recovery transition uses Git ref compare-and-swap. Group acquisition uses a stable target order and releases every lock created by a failed attempt. Renewal preserves the canonical path stored at acquisition and does not require that path to still exist.
