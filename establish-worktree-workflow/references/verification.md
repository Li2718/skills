# Verification

Verify observable behavior through supported project entrypoints. Use disposable worktrees, state, branches, and service namespaces. Do not modify real shared development data or branch history without explicit authorization and a verified recovery path.

## Result model

Record each applicable requirement as `passed`, `failed`, `blocked`, or `unverified`; use `N/A` only with project evidence.

- **Implementation complete:** every applicable requirement is implemented, but some required environments may remain unverified and must be reported.
- **Verification complete:** every applicable requirement is `passed`; only evidence-backed `N/A` items may remain.
- Never claim cross-OS verification unless the workflow ran on every required operating system.

## Discovery and commands

| Requirements | Evidence |
|---|---|
| `DEV-1` to `DEV-5`, `TEST-1` | Map the actual default and semantic entrypoints; start a usable session and demonstrate project-native reload/watch behavior where applicable. |
| `DEV-3` | Trigger a safe script failure or use an isolated fixture; prove the agent/workflow reports it and does not bypass the entrypoint. |
| `DEV-4` | Inventory required components and profiles; prove the chosen default is declared or explicitly approved. |
| `DEV-10` | Start from a session already using an attached worktree, request an edit, and prove the workflow reuses it without creating another worktree. Exercise each allowed exception and prove creation is preceded by the specific reason or an explicit isolation request. |
| `DEV-11` | In one fixture with an existing worktree-location convention, prove the workflow follows it. In another fixture without a convention, prove it adds `/.worktree/` to the repository-root `.gitignore` before creating `<main-worktree-root>/.worktree/<name>`, and prove the main worktree remains clean afterward. |

## Repository worktree locks

| Requirements | Evidence |
|---|---|
| `LOCK-1`, `LOCK-2`, `LOCK-9` | Resolve the lock root from two real worktrees and prove both use the same Git common directory. Inspect the canonical runtime and Codex/Claude adapters for project paths, package-manager assumptions, duplicated rules, and platform-specific entrypoints. |
| `LOCK-3`, `LOCK-4` | Acquire with one owner and prove another owner cannot acquire, renew, release, delete, or bypass the valid lease. Release or expire the first lease and prove waiting acquisition proceeds. |
| `LOCK-5` | Hold one target, request that target with a free target as a group, and prove failure rolls back every lock created by the attempt without disturbing the existing owner. Repeat with source and target worktrees used for integration. |
| `LOCK-6` | Exercise supported mutation and integration workflows and prove acquisition and successful renewal precede every tracked-file, index, commit, ref, branch, and worktree-registration change. Prove renewal failure stops mutation. |
| `LOCK-7` | Prove expired leases are reclaimed. Race two reclaiming owners and prove the winner's new lease remains valid. Inject missing, malformed, and schema-invalid records; prove they block during the grace period and recover afterward. |
| `LOCK-8` | Prove acquiring a lease does not trigger or authorize commit, integration, push, cleanup, or another protected operation. |
| `LOCK-10` | Acquire a group, retain its returned canonical identities, unregister and remove one target, then prove the token still renews from stored records. Selectively release the removed member by its retained identity and prove the remaining member stays leased. Request one unowned member together with an owned member and prove validation fails before either lease changes. |

## Runtime, artifacts, and endpoints

| Requirements | Evidence |
|---|---|
| `DEV-6`, `DEV-7` | Start twice and prove reuse of the same healthy compatible identity and endpoints. Change a compatibility input and prove the documented incompatible-runtime behavior. Inspect gitignored relative state, logs, identities, health data, and secret redaction. |
| `DEV-8` | Run two worktrees at different revisions and prove each continuously executes its own code and artifacts without mutable build/dependency cross-contamination. |
| `DEV-9` | Run static portability checks, then execute the supported workflow on every required OS. |
| `END-1` to `END-3` | Occupy defaults across applicable IPv4/IPv6 binding modes or named endpoint types; prove upward/unique allocation and safe output. Start worktrees concurrently and prove no cross-wiring. Prove unrelated startup failures are not retried as collisions. |

## Shared and isolated state

| Requirements | Evidence |
|---|---|
| `DATA-1` to `DATA-3` | In disposable worktrees, prove shared-state and integration-target ownership are resolved separately through Git; prove non-owner default sharing and shared-state-owner configuration without hardcoded paths. |
| `DATA-4`, `DATA-5` | In disposable state, test applicable ahead, behind, divergent, modified migration, service-version, configuration, protocol, plugin, or persistence mismatches; prove shared startup blocks and points to isolated mode. |
| `DATA-6`, `DATA-7` | Prove first isolated initialization is a consistent shared-state copy. After initialization, add a missing owner startup dependency, reuse isolated mode, and prove it is copied without overwriting existing files. |
| `DATA-8` | Prove incompatible effective protection settings block initial copy and later reuse without leaking secrets or leaving partial data. |
| `DATA-9`, `DATA-10` | Write an isolated marker, restart, and prove it remains; change disposable shared state, reset, and prove a fresh copy. Inject reset failure and prove the last usable state remains. Check the isolation notice on first start and reuse. |
| `DATA-11` | Where persistent work exists, prove copied active work does not replay incorrectly and interrupted isolated-created work remains recoverable. |

## Lifecycle, stop, and clean

| Requirements | Evidence |
|---|---|
| `LIFE-1` | Run two references against shared state/service, stop them in sequence, and inspect counts. Force runtime/orchestrator failure, host-style restart simulation, stale identity, damaged registry, and worktree removal; prove a supported command reconciles state safely. Repeat for file-only state where applicable. |
| `LIFE-2` | Concurrently exercise start, endpoint allocation, reference updates, and disposable lifecycle operations; prove no unsafe final state. |
| `LIFE-3`, `LIFE-4` | Prove the last reference stops workflow-owned services and preserves data; prove adopted external services remain running. |
| `LIFE-5` | Stop a runtime with child processes or in-flight work; prove bounded graceful behavior, descendant cleanup, endpoint release, reference release, and data preservation. |
| `LIFE-6` | Inject safe failures during start and restart; prove partial resources are removed, unhealthy state is not reusable, and the prior healthy runtime is preserved or the documented limitation was approved. |
| `LIFE-7` | Attempt clean, reset, and migration while another live runtime references the target; prove rejection or safe coordination. |
| `LIFE-8` | Invoke cleanup, removal, retry, and recovery through every supported request surface and prove all route to one operation. Prove the happy path removes the target registration, directory, safe local branch, leases, and every associated workflow-owned temporary resource while preserving shared durable state and adopted external resources. Prove protected targets are rejected. |
| `LIFE-9` | Inject failures before and after runtime cleanup, receipt publication, Git unregistration, directory removal, target-lease release, branch deletion, finalization marking, final lease release, and receipt removal. Prove each failure reports the completed phase, releases every lease held by the invocation unless a documented live subprocess still owns and renews it, retains valid recovery metadata until final lease release succeeds, and completes on rerun without repeating destructive work. Prove receipt removal is the final state-changing step. |
| `LIFE-10` | Test nested read-only entries and transient sharing or deletion failures with bounded delays, including on Windows. Prove retries eventually remove the directory when the obstruction clears, never follow directory symlinks, and fail with the remaining path and last error after exhaustion. |
| `LIFE-11` | With explicit authorization, adopt and remove an unregistered legacy residual inside the approved worktree root. Prove the operation rejects registered targets, paths outside that root, Git administration markers, missing authorization, and branch deletion based only on a directory name. |

## Tests

| Requirements | Evidence |
|---|---|
| `TEST-2` | Place markers in every disposable development-state analogue, run tests, and prove tests cannot observe or mutate them. |
| `TEST-3` | Run tests concurrently and prove unique mutable namespaces and dependency environments. |
| `TEST-4` | Prove successful and failed tests both clean their environment; prove cleanup failure fails the test entrypoint. |

## Integration

Use disposable branches and worktrees for state-changing validation.

| Requirements | Evidence |
|---|---|
| `MERGE-1` | Prove source and target leases are acquired together before preflight. Prove dirty, detached, wrong-target, ambiguous, and inspection-failure rejection; inspect reported SHAs, ahead/behind, and commit differences. |
| `MERGE-2`, `MERGE-3` | Prove CI runs against the captured source SHA and only that SHA fast-forwards. Move source or target during CI and immediately before target update; prove the atomic guard blocks integration. |
| `MERGE-4` | Create a non-fast-forward relationship, rebase onto the captured target, rerun CI against the rebased SHA, then fast-forward. Prove conflicts stop. |
| `MERGE-5` | Prove CI failure, concurrent movement, and ambiguity stop without an ordinary merge commit. |
| `MERGE-6` | Integrate once without cleanup and prove the source worktree and branch remain. Integrate once with cleanup and prove the source worktree, branch, and associated temporary resources are removed. Inject cleanup failure and prove it reports a successful target update plus incomplete cleanup. |
| `MERGE-7` | Prove integration without cleanup runs the next command and completion report from the source worktree. Prove integration with cleanup leaves the next command and completion report in the target worktree. |

## Project rules and final state

| Requirements | Evidence |
|---|---|
| `RULE-1` to `RULE-3` | Inspect the project's instruction/skill ownership, canonical rule source, triggers, and native discovery adapters; prove rules are available without duplication or a forced layout. |
| `RULE-4` | Scan changed repository files and persisted state formats for machine-specific absolute paths. |

Run the project's complete CI after behavioral verification. Confirm temporary worktrees, processes, services, endpoints, locks, volumes, test resources, and Git status are in the reported final state.
