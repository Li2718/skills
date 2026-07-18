---
name: worktree-workflow
description: Establish, audit, operate, change, and verify a project-local workflow for concurrent git worktrees in any technology stack. Use for worktree-aware dev, restart, stop, clean, shared or isolated state, endpoint allocation, test isolation, runtime lifecycle, or CI-gated integration back to the primary branch, including when reviewing the project instructions and skills that govern those operations.
---

# Worktree Workflow

Apply a technology-neutral requirements contract to the target repository. Derive implementation choices from that repository instead of copying another project's harness.

## Read references

- Read [requirements.md](references/requirements.md) completely before auditing, operating, planning, changing, or verifying the workflow.
- Read [design-options.md](references/design-options.md) when choosing or assessing an implementation. Its mechanisms are recommendations, not extra requirements.
- Read [verification.md](references/verification.md) before planning validation or claiming completion.

## Workflow

1. **Discover.** Read repository rules and determine the stack, package/build system, startup and test paths, runtime components and profiles, stateful resources, migrations, untracked startup dependencies, existing scripts, supported operating systems, branch model, CI, instructions, and skills.
2. **Classify.** Map every requirement ID to `applicable` or evidence-backed `N/A`. Identify the shared-state owner worktree and the integration target branch/worktree separately.
3. **Audit.** Record existing coverage, gaps, supported entrypoints, and evidence without assuming that an entrypoint name proves its behavior.
4. **Stop for decisions.** Discuss destructive operations, unsafe or lossy data copying, incompatible shared resources, missing cross-platform capability, ambiguous ownership or branch relationships, absent CI, failed scripts, and material trade-offs before proceeding.
5. **Use supported commands.** Perform dev, service, test, clean, and integration operations only through project-supported entrypoints.
6. **Handle missing capability.** If an entrypoint fails or lacks required behavior, report the command, key output, diagnosis, and proposed entrypoint change. Implement the change only after explicit user approval; do not bypass it with hand-built process, service, container, database, server, kill, or merge commands.
7. **Implement the approved scope.** Follow the project's runtime and naming conventions. Select mechanisms from repository evidence; use [design-options.md](references/design-options.md) only as guidance.
8. **Verify and report.** Execute applicable scenarios from [verification.md](references/verification.md), then report changed files, command mappings, results by requirement ID, `N/A` evidence, unverified items, risks, and final Git/worktree/resource state.

## Boundaries

- Do not assume a web application, Node.js, containers, a database, or TCP ports.
- Treat durable files, databases, caches, queues, emulators, object stores, and similar resources as state when present.
- Treat servers, desktop apps, workers, schedulers, watchers, compilers, generators, and child processes as runtime components when present.
- Never write machine-specific absolute paths into repository files.
