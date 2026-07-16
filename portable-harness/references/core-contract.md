# Core contract

## Derive, then design

Record facts from the target repository before proposing a layout:

- project and repository structure;
- existing instruction, skill, and documentation ownership;
- automation runtime and supported script entrypoints;
- CI, test, build, hook, release, and deployment conventions;
- required operating systems and AI agents.

Use explicit project declarations as authority. Ask the user when required support or ownership is not declared. Do not infer a required support promise from files merely being present.

## Separate responsibilities

Use these ownership boundaries:

| Concern | Owner |
| --- | --- |
| Reusable agent workflow | One canonical skill body |
| Tool discovery | Minimal native adapter for that tool |
| Always-applicable project facts | Shared project instruction file |
| Tool-only instruction | That tool's native instruction/import layer |
| Human-maintained convention | Existing project documentation system |
| Mechanical enforcement | Existing checker, or a project-native checker when justified |

Do not make project instruction files discover skills unless a target tool explicitly requires that mechanism. Do not duplicate skill rules into project instructions.

## Keep one canonical workflow

Store workflow semantics once. An adapter may repeat only metadata required for native discovery and the instruction needed to load the canonical body.

Reject these as canonical-source violations unless the project explicitly owns a different contract:

- copied or generated mirrors of the workflow body;
- extra behavioral rules in an adapter;
- orphan adapters without a canonical target;
- symlink or junction discovery as the default portability mechanism.

Tool-specific advanced behavior may remain tool-specific when it cannot be expressed portably. Label its scope and keep it outside the shared core.

## Fit the project

- Follow the project's CI entrypoints and dependency graph. Do not prescribe CI tiers or names.
- Follow the project's runtime and naming conventions for new executable automation.
- Do not assume a particular project topology, runtime, service, data, container, or worktree model.
- Keep existing platform-specific product automation outside the harness migration unless the user explicitly includes it.

## Make validation maintainable

A checker is optional when existing project validation covers the contract. If a checker is needed:

- use the project's supported cross-platform runtime;
- accept an explicit repository root or fixture root;
- run negative tests only in isolated temporary fixtures;
- integrate through the project's CI conventions;
- persist its contract and rule-to-test coverage in an existing project-owned document, canonical maintenance section, test, or configuration.

Do not require a fixed checker filename or documentation path.
