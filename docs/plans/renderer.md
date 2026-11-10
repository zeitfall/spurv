# renderer

Goal: the rendering of the `02-hierarchy` scene through the public API, as milestone 3 requires ([architecture.md](../architecture.md#milestones)).

This plan starts after the component model of [scene.md](scene.md) is defined, and it relies on the modules `gpu` and `cameras` and on the plans [geometry.md](geometry.md) and [materials.md](materials.md).

## Design

- [ ] Resolution of the open questions on device loss, shader conventions, and the frame loop ([architecture.md](../architecture.md#open-questions))

## Creation

- [ ] Asynchronous creation of the renderer on a canvas ([0002](../decisions/0002-webgpu-only.md))
- [ ] GPU resources owned by the renderer ([api-conventions.md](../api-conventions.md#module-level-state))
- [ ] Tracking of the canvas size within the texture size limit of the device, with the replacement of the depth texture

## Frame phases

The phases are defined in [0004](../decisions/0004-frame-phases.md).

- [ ] Extract: flat render-world structures of cameras and of the nodes that carry both a `GeometryComponent` and a `MaterialComponent`, with conversion to f32
- [ ] Prepare: upload of the extracted data and creation of GPU resources
- [ ] Queue: draw commands grouped by pipeline
- [ ] Render: one color and depth pass ([0013](../decisions/0013-reversed-z-depth.md))

## Shaders

- [ ] The WGSL of the unlit material in TypeScript string literals ([0017](../decisions/0017-toolchain-and-examples.md))

## Example

- [ ] Public exports in `src/index.ts`
- [ ] `examples/03-renderer` without WebGPU calls, and its link in the index page

## Out of scope

Frame graph, batching, instancing, culling, lights, multiple passes, automatic GPU tests.

## Open questions

- Is the render world rebuilt on every frame, or updated from the transform versions ([0015](../decisions/0015-transform-versions.md))?
