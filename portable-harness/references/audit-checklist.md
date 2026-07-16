# Audit checklist

## Discover

- Locate applicable repository instructions from the target path upward.
- Inspect the repository status before planning changes.
- Inventory shared and tool-specific instructions, skills, adapters, scripts, CI, tests, hooks, and human documentation.
- Identify the project's supported automation runtime and entrypoint naming.
- Find explicit OS and agent support declarations and record their source.
- Identify local-only, generated, ignored, sensitive, and tool-managed paths.

## Audit ownership

- Identify the canonical body for every shared workflow.
- Compare adapters with their canonical target.
- Find copied mirrors, orphan adapters, adapter-only behavior, and broken load paths.
- Check whether project instructions duplicate skills or perform discovery routing without a tool requirement.
- Check whether human-facing conventions live in the project's documentation system.
- Confirm that tool-specific extensions are labeled and separated from the portable core.

## Audit automation

- Classify new and existing harness automation by runtime and platform support.
- Find `.sh`, `.ps1`, batch, shell-dependent quoting, hard-coded path separators, executable-bit assumptions, symlink/junction requirements, and OS-specific process control.
- Distinguish harness automation from product or operational scripts outside the requested scope.
- Locate equivalent project checks before proposing a new checker.
- Inspect CI and hooks without assuming their names, tiers, or ownership.

## Audit evidence

- Separate official mechanism documentation from observed project behavior.
- Record which OS and agent combinations were actually exercised.
- Record agent and OS versions, repository commit or dirty state, and verification date.
- Mark missing declarations as unknown and ask the user to set the required scope.

## Stop conditions

Stop and discuss before implementation when:

- canonical ownership or migration direction is ambiguous;
- a required tool lacks a project-local discovery mechanism;
- a change would alter established CI, hook, build, or documentation conventions;
- a migration is destructive or would overwrite user content;
- verification needs side effects beyond the approved boundary;
- required OS or agent scope is undeclared;
- the project's runtime cannot express the needed automation portably.

