# Recoverable worktree cleanup

Use one project-native cleanup operation for normal removal, retry after partial failure, and explicitly authorized adoption of legacy residual directories. Internal runtime or state cleanup helpers may remain separate implementation units, but they must not become alternate public removal paths.

## Normal cleanup protocol

1. Resolve the target from Git and the project's worktree-location convention. Reject protected targets, detached or ambiguous ownership, unsafe branch relationships, active shared-state ownership, and dirty state according to project policy.
2. Acquire and validate the complete lease group needed to clean the target and mutate worktree registration. Renew immediately before every state-changing phase.
3. Before runtime cleanup or another irreversible phase, atomically write a non-secret recovery receipt under the Git common directory. Key it by canonical target identity and record only the evidence needed to resume safely, such as the target path, verified branch, ownership classification, and completed phases.
4. Stop the target's owned runtime and clean its workflow-owned disposable state through supported internal capabilities. Preserve shared durable state and adopted external resources, and update the receipt after the phase reaches its verified postcondition.
5. Unregister the worktree, then independently verify that Git no longer lists it. A command error is not a failure if the required postcondition is already true; a zero exit is not success if registration remains.
6. Remove the target directory without following directory symlinks. Make owned entries writable where safe, use bounded retries with backoff for read-only entries and transient sharing violations, and verify the directory is absent.
7. Selectively release the removed target lease while retaining any lease still required for branch or metadata mutation. Renew the remaining lease from stored records.
8. Delete a local branch only when independent Git evidence proves its identity, it is not protected, and it satisfies the project's safe-deletion relationship. Do not force deletion unless the user explicitly authorizes that separate risk.
9. After registration, directory, branch, and resources reach their required cleanup postconditions, atomically mark the receipt ready for finalization. Release every remaining lease, verify the release, and only then remove the receipt as the final state-changing cleanup step. If lease release fails, retain the receipt. If receipt removal fails, a retry must recognize that destructive cleanup is complete and retry only finalization. Report the cleanup and lease outcomes explicitly.

## Failure and retry

- Keep preflight failures non-destructive.
- After irreversible progress, preserve the recovery receipt and make every phase idempotent. A retry through the same entrypoint must detect completed postconditions and continue from the first incomplete phase, including final lease release or receipt removal.
- Release every lease held by the failed invocation before returning failure, unless a documented live subprocess still owns and renews it. A later retry reacquires the current required set; it must not depend on an expired token.
- Lock renewal and release must use the identity stored in lease records after a target directory or Git registration disappears.
- Exhausted directory retries must return the remaining path and last observed error. Never rename a residual directory or report cleanup success merely because Git unregistered it.

## Legacy residual adoption

Legacy residuals have no trusted recovery receipt. Adopt one only when the user explicitly authorizes the exact path and all of these checks pass:

- Git does not register the path as a worktree.
- The path is inside the project's established worktree root, or the default `<main-worktree-root>/.worktree/` root when no other convention exists.
- The target is not a protected worktree and contains no `.git` file, `.git` directory, or equivalent repository administration marker.
- The cleanup operation holds the lease for the remaining worktree that owns registration or branch metadata.

Write an adoption receipt before deletion. Treat the directory as having no branch unless independent repository evidence establishes one; never infer a branch from the directory name.
