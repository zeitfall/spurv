# meshes

Goal: the component of a renderable node that [0026](../decisions/0026-scene-components-and-meshes.md) defines, as milestone 3 requires ([architecture.md](../architecture.md#milestones)).

This plan relies on the modules `scene` and `geometry` and on the plan [materials.md](materials.md).

## Mesh

- [ ] `Mesh`, which refers to a shared `Geometry` and a shared `Material`

## Module

- [ ] The row of the module in [architecture.md](../architecture.md#modules-and-layers)
- [ ] Public exports in `src/index.ts`

## Out of scope

Visibility, shadows, several pairs of a geometry and a material in one mesh.
