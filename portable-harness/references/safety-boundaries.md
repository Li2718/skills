# Safety boundaries

## Default to read-only discovery

Do not edit files or run side-effecting commands until the Plan identifies the exact scope and the user authorizes it. Classify every proposed command as:

- `read-only`;
- `local-ephemeral`;
- `persistent`, `destructive`, or `external`.

For side-effecting commands, record the exact command, working directory, environment, permitted writes, external effects, and cleanup behavior.

Project-owned CI, test, build, and hook entrypoints follow the same authorization rule. Their project ownership determines what should run, not whether running it is safe.

Never automatically execute deployment, release, production migration, paid API, credential access, or persistent-data operations.

## Establish a workspace baseline

Before implementation, capture the whole workspace state.

For Git repositories, include tracked and untracked status, content identity, file type, applicable mode, link target, and paths normalized to current filesystem semantics. For non-Git projects, capture the equivalent filesystem inventory.

Do not scan or hash all ignored content. Record only declared harness-owned or expected ignored paths using existence, type, and necessary non-sensitive metadata. Do not read `.env`, credentials, or project-designated sensitive content without explicit authorization.

## Protect direct edits

Use per-path preconditions covering existence, content identity, file type, applicable mode, and symlink or junction target. Cover both source and destination for rename, and cover create, update, and delete operations.

Use atomic compare-and-swap when the tool supports it. Otherwise obtain the user's explicit commitment to a short quiet write window and recheck the baseline immediately before writing. On any drift, stop, re-audit, update the Plan, and obtain confirmation again. Do not continue a partial write set.

After each write group, compare the whole workspace with the baseline and expected changes. Report unexpected changes; do not automatically revert changes of uncertain ownership.

## Isolate commands correctly

A temporary copy or worktree isolates Git state only. It does not isolate writes through absolute paths, parent traversal, links, global caches, containers, services, networks, or credentials.

Run a write-capable command in the real workspace only when parameters or project configuration provably restrict output to declared, harness-owned cache, build, or temporary paths.

Otherwise use a temporary execution environment with appropriate filesystem, process, environment, and network boundaries. If the available environment cannot prevent or observe a relevant external effect, stop and request authorization for that specific effect.

Apply isolated results back path by path only after rechecking real-workspace preconditions.

