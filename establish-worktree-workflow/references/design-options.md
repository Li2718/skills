# Design options

These are recommended mechanisms, not additional requirements. Prefer an existing project-native equivalent when it satisfies the referenced requirement and can be verified.

| Concern | Recommended default | Acceptable alternatives and selection test |
|---|---|---|
| Runtime identity (`DEV-7`, `LIFE-1`) | PID plus process start identity for host processes; labeled instance identity for managed services | Container identity, OS service instance, application heartbeat, or supervisor state that cannot confuse a reused PID with the old runtime |
| Runtime compatibility (`DEV-6`) | Canonical fingerprint of relevant source/config/dependency/runtime inputs | Version tuple, image digest, migration head, build ID, or explicit comparisons covering every input that changes reuse safety |
| Artifact isolation (`DEV-8`) | Per-worktree build, generated, dependency, and mutable cache namespaces | A proven content-addressed or immutable shared cache that cannot cross-wire worktree outputs |
| Endpoint coordination (`END-1`, `END-2`) | Atomic reservation or repository-wide allocation lock | Let actual binding arbitrate, then fully roll back and retry only the conflicting component without leaking partial runtime state |
| Shared compatibility (`DATA-4`) | Compatibility fingerprint for code, schema, service, and persistence inputs | Explicit version/config/protocol checks with the same fail-closed result |
| State copying (`DATA-6`, `DATA-9`) | Technology-supported snapshot into staging, validate, then publish atomically | Transactional backup/restore, copy-on-write clone, volume snapshot, or a project-native consistent export/import |
| Protected state (`DATA-8`) | Persist a non-secret protection/config fingerprint with isolated state | Recompute compatibility from authoritative metadata without storing secret material |
| Copied queued work (`DATA-11`) | Mark copied active work terminal or neutral before processors start | Namespace, generation, ownership, or lease rewriting that prevents replay and preserves isolated-runtime recovery |
| Reference lifecycle (`LIFE-1`) | Shared registry with instance identity, leases, and reconciliation on supported commands | Direct authoritative service/supervisor discovery that can recover stale state and determine actual live users |
| Operation safety (`LIFE-2`, `LIFE-7`) | Cross-process locks plus transient operation holds | Database transactions, service-manager serialization, compare-and-swap state transitions, or another mechanism with equivalent race behavior |
| Worktree coordination (`LOCK-1` to `LOCK-7`) | Canonical Node.js runtime storing lease blobs behind compare-and-swap Git refs, with stable group ordering and rollback | A project-native cross-platform entrypoint with the same shared namespace, ownership, waiting, recovery, and group-acquisition behavior |
| Resource ownership (`LIFE-3`) | Record whether a resource was created or adopted by the workflow | External supervisor ownership or explicit user-managed mode in which the workflow only connects and releases its own reference |
| Stop (`LIFE-5`) | Graceful drain, bounded wait, then owned process-tree escalation | Container/service shutdown semantics that prove descendants and endpoints are released |
| Merge target guard (`MERGE-2`) | Expected-old SHA / compare-and-swap ref update | Protected branch or integration API with equivalent atomic target-version precondition |
| Skill organization (`RULE-1`, `RULE-2`) | Reuse the project's existing canonical skill and native discovery model | One worktree skill, separate dev/merge skills, or another project-owned split with one source for each rule |

When no option provides the required behavior, stop and present the missing capability and trade-off instead of weakening the requirement silently.
