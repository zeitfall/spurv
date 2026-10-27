# 0003. Scene graph with components

- Status: Accepted
- Date: 2026-10-27

## Context

- A deep inheritance tree with a god-object base (e.g. Three.js `Object3D` → `Mesh` → `SkinnedMesh`) couples unrelated concerns.
- A full ECS gives poor ergonomics in JavaScript, which has no value-type structs, and complicates the API.
- Hierarchy is natural for 3D scenes.

## Decision

- The scene is a tree of nodes. A node is responsible only for hierarchy and its transform.
- What a node *is* (renderable, camera, light) is defined by the components attached to it.
- Nodes are never subclassed to add behavior.

## Consequences

- No god object. Concerns are isolated per component.
- The renderer finds work by querying components, not by type-checking nodes.
- Component details are unresolved; they are listed in [architecture.md](../architecture.md#open-questions).
