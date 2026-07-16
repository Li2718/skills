# Agent mechanisms

## Select a mechanism

For each target agent:

1. Find the current official project-local instruction and skill discovery mechanisms.
2. Record the official source, product version, and lookup behavior.
3. Prefer native import or load semantics over filesystem links.
4. Create the smallest adapter that the mechanism permits.
5. Test discovery and complete canonical loading in the actual agent.

Do not choose a directory from memory or another tool's convention. Agent discovery locations and supported metadata can change by version.

## Keep evidence separate

Maintain two evidence fields for every mechanism:

| Evidence | Meaning |
| --- | --- |
| Official capability | The vendor documents the mechanism for the recorded version |
| Project verification | The recorded agent version discovered the project adapter and loaded the canonical workflow in this repository state |

Official capability does not prove the project wiring works. A successful project test does not establish support for other versions or operating systems.

## Adapter contract

An adapter may contain:

- required discovery frontmatter or metadata;
- a short tool-native instruction that loads the canonical skill;
- unavoidable tool-specific invocation controls, clearly labeled as tool-specific.

An adapter must not become a second workflow body. If a tool cannot load the canonical body from a thin adapter, record that capability as unsupported or unknown and discuss a project-specific trade-off with the user.

## Installation boundary

Keep the reusable skill package independent from installation adapters. Generate or maintain discovery entries when installing into a target project, based on that project's required agents and their current official mechanisms.

User-global installation may aid one developer, but it does not count as a project-local harness capability.

