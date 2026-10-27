# 0006. Transform change tracking

- Status: Accepted
- Date: 2026-10-27

## Context

Mutable vectors ([0005](0005-math-conventions.md)) do not report their own mutation. The alternatives all have drawbacks:

- `needsUpdate` flags are implicit and easy to forget.
- Recomputing every matrix every frame wastes work on static scenes.
- Change callbacks on vectors add per-write overhead and make math code polymorphic.

## Decision

- `Transform` stores a snapshot of the position, rotation, and scale it last composed from (10 numbers).
- A scene update pass runs once per frame, before data is extracted for rendering ([0004](0004-frame-phases.md)). It compares the current values to the snapshot. On a difference, it recomposes the local matrix, increments `version`, and marks the subtree for world-matrix update.
- Consumers detect changes by comparing `version`.
- The rotation's single source of truth is a quaternion. Euler angles are conversion helpers only.

## Consequences

- Users mutate vectors freely. There are no flags to remember.
- The per-node cost is a 10-number comparison, not a matrix composition.
- Changes become visible in the scene update pass, not immediately. Reading a current world matrix mid-frame requires an explicit update call.
