# materials

Goal: the single unlit material required by milestone 3 ([architecture.md](../architecture.md#milestones)), structured as [0026](../decisions/0026-scene-components-and-meshes.md) defines.

## Material

- [ ] `Material`, a description that holds no GPU objects
- [ ] An unlit material that colors a surface by its normal, as `02-hierarchy` does

## Out of scope

Lighting models, textures, user-supplied WGSL, the component of a renderable node.

## Open questions

- How does a material description select its shader, given that the shaders belong to `renderer`?
