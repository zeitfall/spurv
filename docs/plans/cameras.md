# cameras

Goal: the camera required by milestone 3 ([architecture.md](../architecture.md#milestones)), structured as [0019](../decisions/0019-scene-components.md) defines.

## Projection

- [ ] The abstract class `Projection`
- [ ] `PerspectiveProjection` with the field of view and the near and far distances

## Camera

- [ ] The component `Camera`, which holds a `Projection`
- [ ] A view matrix derived from the world matrix of the node
- [ ] A view-projection matrix for the extract phase ([0004](../decisions/0004-frame-phases.md))

## Out of scope

Orthographic projection, camera controllers, frustum extraction.

## Open questions

- Is the aspect ratio a property of the camera, or does the renderer derive it from the render target?
