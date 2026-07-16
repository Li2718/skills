# Cases

## Existing CI already validates the harness

Map the contract to existing project checks and tests. Add no checker merely to standardize naming. Record where the coverage contract is maintained.

## Project has custom CI tiers

Use the project's tier names and dependency rules. Place harness validation where its cost and purpose fit the existing convention. Do not impose a lite/full model or require one tier to include another.

## Project shape differs from prior examples

Derive its actual build and runtime model. A library, CLI, desktop application, plugin, firmware project, data pipeline, or monorepo may require different validation and no service orchestration.

## Agent supports only user-global skills

Record user-global support separately. Mark the agent unsupported or unknown for project-local harness delivery unless the project and user explicitly adopt another reproducible mechanism.

## Agent cannot load a neutral canonical body

Stop and present the concrete limitation. Options such as generated mirrors, duplicated bodies, or tool-specific ownership change the canonical-source contract and require an explicit user decision.

## Repository already contains platform-specific scripts

Restrict the audit to harness automation. Keep existing product and operational scripts unchanged unless the user explicitly expands scope.

## Verification command has hidden side effects

Treat it according to the discovered effects, even when it is the project's official CI or test command. Run it only after the Plan names and authorizes those effects and their cleanup.

## Working tree changes during implementation

Stop at the first failed precondition or unexpected workspace delta. Preserve all uncertain changes, rebuild the baseline, revise the Plan, and ask for confirmation before continuing.
