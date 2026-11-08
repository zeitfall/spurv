# geometry

Goal: the CPU-side geometry required by milestone 3 ([architecture.md](../architecture.md#milestones)), structured as [0019](../decisions/0019-scene-components.md) defines.

## Geometry

- [ ] `Geometry` with vertex attributes and indices stored in typed arrays
- [ ] A description of the vertex layout
- [ ] A cube with positions, normals, and texture coordinates

## Component

- [ ] `GeometryComponent`, which refers to a shared `Geometry`

## Out of scope

Other primitives, bounding volumes, model loading, GPU buffers.

## Open questions

- Are the attributes interleaved or stored separately?
