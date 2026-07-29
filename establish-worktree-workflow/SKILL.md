---
name: establish-worktree-workflow
description: Establish, audit, migrate, maintain, and verify a target repository's project-local multi-worktree development workflow and companion skills. Use only when creating or changing project rules, skills, locking, dev and test isolation, state and endpoint handling, runtime lifecycle, cleanup, or CI integration capabilities. Do not use for routine edits, dev, restart, stop, test, cleanup, or integration after the project-local workflow exists; use the generated project-local skill instead.
---

# Establish Worktree Workflow

This is a project-construction meta-skill. Apply a technology-neutral requirements contract to establish or maintain the target repository's project-local workflow and companion skills. After construction, route routine multi-worktree operations through the generated project-local skill. Derive implementation choices from the target repository instead of copying another project's harness.

## Read references

- Read [requirements.md](references/requirements.md) completely before auditing, planning, changing, or verifying the target project's workflow.
- Read [locking.md](references/locking.md) before changing tracked files, the index, commits, branches, or worktrees.
- Read [design-options.md](references/design-options.md) when choosing or assessing an implementation. Its mechanisms are recommendations, not extra requirements.
- Read [verification.md](references/verification.md) before planning validation or claiming completion.

## Workflow

1. **Discover.** Read repository rules and determine the stack, package/build system, startup and test paths, runtime components and profiles, stateful resources, migrations, untracked startup dependencies, existing scripts, supported operating systems, branch model, CI, instructions, and skills.
2. **Classify.** Map every requirement ID to `applicable` or evidence-backed `N/A`. Identify the shared-state owner worktree and the integration target branch/worktree separately.
3. **Audit.** Record existing coverage, gaps, supported entrypoints, and evidence without assuming that an entrypoint name proves its behavior.
4. **Stop for decisions.** Discuss destructive operations, unsafe or lossy data copying, incompatible shared resources, missing cross-platform capability, ambiguous ownership or branch relationships, absent CI, failed scripts, and material trade-offs before proceeding.
5. **Select the working worktree.** When edits need a worktree, reuse the registered worktree already used by the current session. Create another only when no session worktree exists, it is unavailable, detached, protected from edits, or the user explicitly requests separate isolation. State the specific reason before creating one. Follow the project's existing worktree-location convention; when none exists, create worktrees under `<main-worktree-root>/.worktree/` and add `/.worktree/` to the repository-root `.gitignore` before creation.
6. **Acquire repository locks.** Use [locking.md](references/locking.md) to lease every worktree that an operation may mutate. Acquire source and target worktrees together before integration. Wait for conflicting valid leases; never delete or bypass them.
7. **Use supported commands.** Perform dev, service, test, cleanup/removal, and integration operations only through project-supported entrypoints. Renew the applicable lease immediately before each command that changes tracked files, the index, commits, branches, or worktrees.
8. **Handle missing capability.** If an entrypoint or lock command fails or lacks required behavior, report the command, key output, diagnosis, and proposed change. Implement the change only after explicit user approval; do not bypass it with hand-built process, service, container, database, server, kill, lock deletion, or merge commands.
9. **Implement the approved scope.** Follow the project's runtime and naming conventions. Select mechanisms from repository evidence; use [design-options.md](references/design-options.md) only as guidance.
10. **Verify, release, and report.** Execute applicable scenarios from [verification.md](references/verification.md). After integration without cleanup, return to the source worktree. After integration with cleanup, run the worktree cleanup operation and remain in the target worktree. Release held leases after protected work and rollback or cleanup complete. Then report changed files, command mappings, results by requirement ID, `N/A` evidence, unverified items, risks, and final Git/worktree/resource state.

## Boundaries

- Do not assume a web application, Node.js, containers, a database, or TCP ports.
- Treat durable files, databases, caches, queues, emulators, object stores, and similar resources as state when present.
- Treat servers, desktop apps, workers, schedulers, watchers, compilers, generators, and child processes as runtime components when present.
- Never write machine-specific absolute paths into repository files.
- Treat locks only as workspace coordination. Require separate user authorization for commit, integration, push, cleanup, and every other externally consequential operation.
