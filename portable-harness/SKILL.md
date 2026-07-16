---
name: portable-harness
description: Audit, design, migrate, maintain, and verify a project-local AI development harness that works across the operating systems and AI agents required by the project. Use when creating or changing shared agent instructions, skills and discovery adapters, cross-platform project automation, CI or hook integration for harness checks, human-facing AI tooling conventions, or when assessing whether a repository's harness is genuinely portable and cross-agent.
---

# Portable Harness

Build the harness from the target project's own conventions. Keep the reusable workflow tool-neutral and make every portability claim evidence-based.

## Required references

Read these before planning or changing a harness:

- [core-contract.md](references/core-contract.md) for ownership, canonical-source, documentation, and automation rules.
- [safety-boundaries.md](references/safety-boundaries.md) before running commands or editing files.

Read the remaining references when their phase applies:

- [audit-checklist.md](references/audit-checklist.md) during discovery and audit.
- [agent-mechanisms.md](references/agent-mechanisms.md) when selecting or validating discovery adapters.
- [verification.md](references/verification.md) when defining support scope, verification, or delivery claims.
- [cases.md](references/cases.md) when a project presents an ambiguous migration or ownership case.

## Workflow

1. **Discover** the project shape, repository rules, existing instructions and skills, automation runtime, package or build system, CI, tests, hooks, documentation conventions, supported operating systems, and target AI agents.
2. **Audit** ownership, duplicated rules, canonical sources, discovery adapters, platform coupling, validation coverage, and current evidence.
3. **Plan** exact file changes, migration treatment, command side effects, authorization needs, verification matrix, and stop conditions.
4. **Discuss** any material trade-off, missing project capability, destructive migration, unclear ownership, or proposed change to an established project convention. Continue only after the user decides.
5. **Implement** only the approved scope. Preserve unrelated and concurrent user changes.
6. **Verify** structure, real agent discovery and canonical loading, and the target project's own required validation entrypoints.
7. **Report** the changed files, derived project conventions, exact commands and results, support matrix, unverified items, risks, and delivery state.

## Operating rules

- Derive CI names and relationships from the project. Do not impose a fixed CI or hook model.
- Derive the project shape and topology from evidence. Do not impose a runtime, service, data, container, or package-management model.
- Keep shared workflow content canonical. Keep each tool adapter limited to native discovery metadata and a load instruction.
- Prefer project-local delivery. Do not count user-only installation as project harness support.
- Treat checkers as optional. Reuse equivalent project validation when it exists; otherwise make any new checker follow the project's runtime, naming, and CI conventions.
- Do not add platform-specific harness automation such as `.sh` or `.ps1`. Existing platform-specific product scripts remain out of scope unless the user expands the task.
- Do not claim portability from static inspection. Apply the evidence and status rules in [verification.md](references/verification.md).
