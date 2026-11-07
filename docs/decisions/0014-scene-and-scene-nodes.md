# 0014. Scene and scene nodes

- Status: Accepted
- Date: 2026-11-06

## Context

- [0003](0003-scene-graph-with-components.md) makes a node responsible for hierarchy and its transform, but leaves open whether the transform is a mandatory component ([architecture.md](../architecture.md#open-questions)).
- `Node` is a global DOM interface. A library class with that name shadows it in every file that imports it.
- A `#private` field is visible only inside its class ([0007](0007-runtime-encapsulation.md)). A traversal implemented outside the node class needs runtime access to the node's children and transform state, and `@internal` hides members only from the published `.d.ts`.
- Scene graphs traverse in one of two ways. Object-oriented graphs (Ogre 1.x, Godot) update recursively in the node. Data-oriented engines (Bevy, Filament, Ogre 2.x) update from an external pass over flat arrays, which gains from SIMD, cache locality, and threads. JavaScript offers neither SIMD nor simple shared-memory threads.

## Decision

- A `Scene` owns a root `SceneNode`, created with the scene and exposed as `scene.root`. `scene.update()` is the single entry point of the per-frame scene update pass ([0015](0015-transform-versions.md)).
- `SceneNode` holds the hierarchy and exactly one `Transform`. The transform is part of the node, not a component.
- The hierarchy is a tree. It is changed only from the parent side, through `addChild` and `removeChild`. `addChild` detaches the child from its previous parent. A node cannot become its own descendant, and a scene root cannot become a child.
- `parent` is read-only. Children are stored in an array and read through `childCount` and the `children()` iterator ([0007](0007-runtime-encapsulation.md)).
- The traversal is recursive and implemented in `SceneNode`.
- Derived matrices (local and world) are never returned by reference. They are copied into a matrix supplied by the caller (`copyWorldMatrixTo`). The transform inputs (position, rotation, scale) are exposed as live instances.

## Consequences

- The open question "Is `Transform` mandatory?" is resolved.
- Every node carries a transform, including nodes used only for grouping. A static node costs one snapshot comparison per frame ([0015](0015-transform-versions.md)).
- Hierarchy invariants hold at runtime: no code outside the module can create a cycle, a second parent, or a parented root.
- The node class contains both data and update logic. A move to data-oriented storage changes only the internals behind `scene.update()`.
- `children()` iterates the live array. Changing the children during iteration skips or repeats nodes; this is documented.
- Reading a world matrix costs a copy of 16 numbers.
