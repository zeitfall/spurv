# scene

Goal: the component model of [0019](../decisions/0019-scene-components.md), as milestone 3 requires ([architecture.md](../architecture.md#milestones)).

## Components

- [x] An ADR that defines the component model
- [ ] The abstract class `Component` with its read-only `node`
- [ ] `SceneNode.addComponent` and `SceneNode.removeComponent`, with the errors that 0019 defines
- [ ] `SceneNode.getComponent` and `SceneNode.components`
- [ ] Traversal that finds the components of a scene for the extract phase ([0004](../decisions/0004-frame-phases.md))
- [ ] Public exports in `src/index.ts`

## Out of scope

Per-frame component callbacks, serialization, lookup of nodes by name.
