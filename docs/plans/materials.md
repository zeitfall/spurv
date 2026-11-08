# materials

Goal: the single unlit material required by milestone 3 ([architecture.md](../architecture.md#milestones)), structured as [0019](../decisions/0019-scene-components.md) defines.

## Material

- [ ] `Material`, a description that holds no GPU objects
- [ ] An unlit material that colors a surface by its normal, as `02-hierarchy` does

## Component

- [ ] `MaterialComponent`, which refers to a shared `Material`

## Out of scope

Lighting models, textures, user-supplied WGSL.

## Open questions

- How does a material description select its shader, given that the shaders belong to `renderer`?
