# 0015. Transform versions

- Status: Accepted
- Date: 2026-11-06

## Context

This ADR supersedes [0006](0006-transform-change-tracking.md). It keeps its snapshot and replaces the marking of subtrees.

- In 0006, the scene update pass marks the subtree of a changed node for world-matrix update. A mark exists only during one pass, and it misses two cases:
  - A node moved under a parent that did not change in that frame keeps the world matrix computed from its previous parent.
  - After a mid-frame update of one node's chain of ancestors, the next full pass finds those ancestors unchanged and skips their other descendants, which stay stale.
- A boolean "changed" result is consumed by its first reader. With several readers (the scene pass, the renderer, user code), the others miss the change.
- A getter must be O(1) and free of side effects ([code-style.md](../code-style.md#accessors-and-methods)), so a world matrix cannot be updated lazily on read.

## Decision

- `Transform` holds `position`, `rotation`, and `scale` as live public instances, a snapshot of the values it last composed from (10 numbers), the local matrix, and `localMatrixVersion`.
- `transform.updateLocalMatrix()` compares the current values to the snapshot. On a difference, it recomposes the local matrix, updates the snapshot, and increments `localMatrixVersion`. It returns nothing and may be called at any time.
- `SceneNode` holds the world matrix, `worldMatrixVersion`, and the transform `localMatrixVersion` and parent `worldMatrixVersion` it last composed from. When either differs from the current value, the node recomposes its world matrix and increments `worldMatrixVersion`.
- `addChild` and `removeChild` reset the remembered parent version to a value no node has.
- `scene.update()` updates the whole tree from the root down. `node.updateWorldMatrix()` updates only the chain from the root to that node. `node.updateSubtree()` updates that chain and then all descendants of the node.
- Consumers detect changes by comparing versions they store themselves.
- The rotation's single source of truth is a quaternion. Euler angles are conversion helpers only.

## Consequences

- Users mutate vectors freely. There are no flags to set or reset.
- A static node costs one snapshot comparison and two integer comparisons per frame, with no matrix arithmetic.
- Full and partial updates produce the same result in any order. Reparenting needs no special path.
- Changes become visible in the scene update pass or after an explicit update call, not immediately.
- Versions are JavaScript numbers. Incremented once per frame, they stay exact for millions of years.
- The storage of the snapshot is an implementation detail.
