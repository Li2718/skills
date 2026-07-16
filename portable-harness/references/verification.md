# Verification and claims

## Define required scope

Build the support matrix from explicit project declarations or user confirmation. Do not infer required support from available machines or installed tools.

Use one row per required OS and agent combination. Record:

- OS name and version;
- agent name and version;
- source of the requirement;
- official mechanism evidence;
- project verification evidence;
- commit and workspace state;
- verification date.

Use these orthogonal fields:

| Field | Values |
| --- | --- |
| `requirement` | `required`, `optional`, `out-of-scope` |
| `capability` | `supported`, `unsupported`, `unknown` |
| `verification` | `verified`, `unverified`, `not-applicable` |

Valid combinations are: supported with verified or unverified; unsupported with not-applicable; unknown with unverified; out-of-scope with not-applicable.

## Verify in layers

1. **Static contract:** canonical source, thin adapters, instruction ownership, platform-neutral automation, and checker coverage where applicable.
2. **Agent behavior:** each required matrix cell discovers its adapter and completely loads the canonical workflow.
3. **Project validation:** run the exact CI, test, build, or hook entrypoints required by the target project after classifying and authorizing their side effects.

Do not substitute static inspection or vendor documentation for real agent behavior.

## Report result state

Use two fields:

| Field | Values |
| --- | --- |
| `implementation` | `audit-only`, `applied`, `partial` |
| `verification` | `complete`, `conditional`, `blocked` |

Use `conditional` when the mechanism appears viable but required evidence is incomplete. Use `blocked` for required unsupported combinations, unresolved authority or trade-offs, failed partial implementation that prevents progress, or a missing required mechanism. Include the reason and recovery condition.

`partial` implementation cannot have `complete` verification.

## Limit claims

When verification is not complete, report only the specific structure, checks, or matrix cells verified. Do not use a general `harness verified` claim.

- Use `project harness verified` only when all required matrix cells and required project validation are complete.
- Use `cross-agent harness verified for <scope>` only when every required combination in that explicit scope is verified and the scope contains at least two different agents.
- Use `cross-OS harness verified for <scope>` only when every required combination in that explicit scope is verified and the scope contains at least two different operating systems.
- Use `portable cross-system, cross-agent harness verified` only when the complete required matrix is verified and contains at least two different agents and two different operating systems.

List all unverified or out-of-scope combinations. Bind every claim to the recorded versions, repository state, and evidence date.

