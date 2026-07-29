# Multi-worktree requirements

These are behavior requirements. A project may use any implementation that satisfies and verifies them.

## Commands and runtime

- **DEV-1 Default entrypoint:** Provide one project-native default development command. Prefer `pnpm dev` only for a pnpm project.
- **DEV-2 Command surface:** Provide or map project-native entrypoints for dev, restart, stop, status/list, worktree cleanup/removal, test, isolated start, isolated restart, isolated reset, logs, dependency services, and worktree integration when applicable.
- **DEV-3 Supported operations only:** Run local development and integration operations only through supported entrypoints. If one fails or lacks capability, stop and report the command, key output, diagnosis, and proposed change; change it only after explicit approval.
- **DEV-4 Complete session:** Start every component required for a usable development session. If the repository has multiple mutually exclusive development profiles and no declared default, stop and ask the user to choose.
- **DEV-5 Reload:** Use mature project-native hot reload, watch, or automatic rebuild capabilities when available.
- **DEV-6 Reuse:** Repeated default startup in one worktree must reuse a healthy compatible runtime. Define the behavior for an unhealthy or incompatible existing runtime. Starting an additional runtime requires explicit intent.
- **DEV-7 Runtime state:** Store runtime identity, mode, compatibility information, endpoints, safe display URLs, health/status data, and log location under a gitignored repository-relative temporary directory. Record suitable host-process, container, service, or application identities. Do not persist or print secrets.
- **DEV-8 Worktree isolation:** Each runtime must execute the current worktree's code and must not be corrupted by another worktree's generated files, dependency environment, build output, cache, image tag, or equivalent mutable artifacts.
- **DEV-9 Cross-platform automation:** Workflow automation must run on every required operating system. Do not introduce `.sh`, `.bash`, `.zsh`, `.fish`, `.ps1`, `.bat`, or `.cmd` workflow entrypoints. Use structured subprocess arguments and portable filesystem, process, signal, and locking APIs.
- **DEV-10 Worktree reuse:** Before creating a worktree for edits, prefer a registered worktree already used by the current session. Create another only when no session worktree exists, it is unavailable, detached, protected from edits, or the user explicitly requests separate isolation. Report the specific reason before creation.
- **DEV-11 Default worktree location:** Follow the project's existing worktree-location convention. When none exists, create worktrees under `<main-worktree-root>/.worktree/`; before creating the first one, add `/.worktree/` to the repository-root `.gitignore` so nested worktree contents never appear in the main worktree's Git status.

## Repository worktree locks

- **LOCK-1 Shared location:** Store lock state under the repository's Git common directory. Resolve that directory through Git so every worktree and every Codex or Claude session shares one lock namespace without cross-session queries.
- **LOCK-2 Command surface:** Provide `acquire`, `renew`, `status`, and `release` through the canonical skill's cross-platform runtime. Resolve the runtime relative to the canonical skill and do not require a project-specific package manager or hardcoded project path.
- **LOCK-3 Lease ownership:** Use owner-labelled, token-controlled leases with explicit expiry. Only the matching token may renew or release an active lease. Allow a new owner to reclaim an expired lease.
- **LOCK-4 Waiting:** Let acquisition wait and poll for valid conflicting leases, with an optional timeout. Never delete, overwrite, or bypass another owner's valid lease.
- **LOCK-5 Group acquisition:** Acquire every requested worktree in a stable order as one group. If any target cannot be acquired, release every lock created by that attempt. Integration must acquire the source and target worktrees together before changing either.
- **LOCK-6 Mutation gate:** Hold the corresponding worktree lease before changing tracked files, the index, commits, HEAD, refs, checked-out branches, or worktree registration. Renew immediately before each state-changing command and during long operations; stop when renewal fails.
- **LOCK-7 Recovery:** Recover abandoned expired leases automatically. Treat missing, malformed, or schema-invalid lock records as damaged initialization and reclaim them only after a bounded grace period that prevents racing a live initializer.
- **LOCK-8 Authorization boundary:** A lease coordinates workspace access only. It does not authorize commit, integration, push, cleanup, destructive changes, or any action requiring user approval.
- **LOCK-9 Canonical ownership:** Keep the locking protocol, runtime, and behavior rules in one canonical skill package. Codex and Claude discovery adapters must load that same package without duplicating its rules.

## Endpoints

Apply this section only when runtimes expose host-bound ports, sockets, pipes, or equivalent endpoints.

- **END-1 Allocation:** Allocate every endpoint without cross-worktree collision. Numeric ports start from the project default and probe upward through a finite range; named endpoints use worktree-unique names and handle stale instances safely.
- **END-2 Binding coverage:** Port checks must cover the runtime's IPv4/IPv6 loopback and wildcard binding behavior. Concurrent starts must not cross-wire runtimes. Retry only confirmed endpoint conflicts and surface unrelated startup failures.
- **END-3 Visibility:** Print safe, redacted endpoints after startup and through status output. Preserve compatible endpoints across reuse and restart where possible.

## Shared and isolated state

Apply this section only when the project has persistent development state or dependency services.

- **DATA-1 Ownership:** Identify the shared-state owner worktree from Git without hardcoded paths. Keep this role distinct from the worktree that owns the integration target branch.
- **DATA-2 Shared default:** Non-owner worktrees use shared state and its connection configuration by default. Never switch default startup silently to isolated state.
- **DATA-3 Local files:** Reads and writes of untracked startup files default to the shared-state owner. Files explicitly copied for isolated startup belong to the isolated worktree.
- **DATA-4 Shared compatibility:** Before shared startup, verify that the worktree's schema, migration graph and contents, service versions, configuration, protocol, plugins, and persistence format are compatible where applicable. Block incompatible startup and point to isolated mode.
- **DATA-5 Schema work:** Require explicit isolated mode for worktree changes to schema, migrations, or other incompatible data contracts.
- **DATA-6 Isolated initialization:** On first isolated start, create a consistent per-worktree copy of shared state. If safe copying is unavailable, lossy, or ambiguous, stop and discuss instead of silently using unrelated empty state.
- **DATA-7 Startup dependencies:** On isolated start or reuse, copy missing required untracked startup dependencies from the shared-state owner without overwriting existing worktree files.
- **DATA-8 Protected data:** Verify effective encryption or credential compatibility before copying protected data and before reusing protected isolated data after configuration changes. Use the same configuration semantics as the real runtime.
- **DATA-9 Isolated lifecycle:** Isolated restart preserves isolated state. Isolated reset rebuilds it from a fresh shared-state copy. Failure must not silently replace the last usable state with partial data.
- **DATA-10 Isolation notice:** Every isolated start or reuse must state that writes remain in the current worktree and do not synchronize back.
- **DATA-11 Copied work:** When copied state contains queued, running, scheduled, or leased work, prevent it from being replayed incorrectly while preserving recovery of work created by the isolated runtime. If safe classification is unavailable, stop and discuss.

## State and service lifecycle

- **LIFE-1 Live references:** Count references from live runtimes to shared and isolated state or services. Recover stale references after crashes, host restarts, damaged state, or worktree removal using actual instance identity rather than a state file alone.
- **LIFE-2 Concurrent operations:** Use repository worktree leases together with resource-specific coordination to prevent startup, endpoint allocation, migration, seed, backup, reset, restore, stop, clean, and reference updates from racing into an unsafe state.
- **LIFE-3 Ownership:** Distinguish workflow-owned resources from adopted external resources. Releasing the last workflow reference must not stop a resource owned elsewhere.
- **LIFE-4 Automatic stop:** When the last live reference to a workflow-owned managed service disappears, stop the service automatically and preserve durable data. File-only state has no service to stop but still participates in safety checks.
- **LIFE-5 Stop behavior:** Stop the owned runtime and its descendants safely, allow required work to drain, release endpoints and references, and preserve durable data unless an explicit destructive command says otherwise.
- **LIFE-6 Failure recovery:** A partial start or restart must clean newly created resources and must not leave an unhealthy runtime registered as reusable. Preserve or restore the previous healthy runtime when the project can do so safely.
- **LIFE-7 Active-use safety:** Clean, reset, migration, and other destructive operations must reject or safely coordinate with live references before changing data or services.
- **LIFE-8 Worktree cleanup:** Route cleanup and removal requests through one project-native operation. Remove the target worktree, its checked-out branch, and all associated workflow-owned runtime state, disposable artifacts, isolated state, endpoints, locks, logs, references, and managed resources. Preserve shared durable state and adopted external resources. Reject removal of the integration-target worktree or active shared-state owner.

## Test isolation

- **TEST-1 Entry:** Provide one project-native test entrypoint.
- **TEST-2 Environment:** Give every test run unique disposable state and independent dependency services. Tests must not read or write shared, isolated, or development-runtime data.
- **TEST-3 Parallelism:** Concurrent test runs must not share mutable namespaces, endpoints, directories, projects, or services.
- **TEST-4 Cleanup:** Clean the test environment after success and failure. Treat cleanup failure as test failure.

## Worktree integration

- **MERGE-1 Preflight:** Acquire the source and target worktree leases as one group, then verify both worktrees are clean, attached to clear named branches, and on the expected source/target relationship. Report branches, source and target SHAs, ahead/behind counts, and commit differences.
- **MERGE-2 Exact CI:** Run the project's required CI against the exact source SHA. Recheck source and target after CI and ensure the final target update still expects the captured target SHA or has an equivalent atomic guard.
- **MERGE-3 Fast-forward first:** Integrate with fast-forward only unless the user explicitly requests a merge commit.
- **MERGE-4 Rebase path:** If the captured target is not an ancestor of the source, rebase the source onto that captured target, stop on conflict or ambiguity, then rerun CI against the rebased SHA before fast-forwarding.
- **MERGE-5 Stop conditions:** Stop and report on dirty state, detached HEAD, inspection failure, unclear relationships, conflicts, concurrent movement, CI failure, or human judgment. Never substitute an ordinary merge commit.
- **MERGE-6 Conditional cleanup:** Preserve the source worktree and branch unless cleanup is part of the integration request. When cleanup is requested, run the worktree cleanup operation after the target update. Report a successful target update and incomplete cleanup if that operation fails.
- **MERGE-7 Final location:** After integration without cleanup, return to the source worktree before running subsequent commands or reporting completion. After integration with cleanup, remain in the target worktree.

## Project instructions and skills

- **RULE-1 Ownership model:** Follow the repository's existing instruction, documentation, and skill ownership model. Do not force a particular skill split or directory layout.
- **RULE-2 Rule placement:** When project skills exist, place worktree requirements in the appropriate canonical skill or skills, with triggers covering the operations they govern. Keep tool discovery adapters thin and do not duplicate skill rules into shared project instructions.
- **RULE-3 Required agent behavior:** Persist session worktree reuse, the default worktree location and ignore rule, the shared-lock acquisition and renewal gate, supported-entrypoint, failure-reporting, untracked-file ownership, isolated-data, test-isolation, and CI-before-fast-forward rules where the project's agents will apply them.
- **RULE-4 Relocatability:** Do not write machine-specific absolute paths into repository rules, scripts, state formats, or documentation.
