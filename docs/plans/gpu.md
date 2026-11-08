# gpu

Goal: the WebGPU layer that `renderer` requires for milestone 3 ([architecture.md](../architecture.md#milestones)), within the scope of [0020](../decisions/0020-gpu-layer-scope.md) and in the form of [0021](../decisions/0021-render-device.md).

## RenderDevice

- [x] The constructor that accepts a `GPUDevice`
- [x] `RenderDevice.create` with `RenderDeviceOptions`, and an error when WebGPU or an adapter is unavailable
- [x] The getter `limits`
- [x] `createCanvasContext`, with an error when the canvas provides no WebGPU context
- [x] `addEventListener` and `removeEventListener` with the events `devicelost`, `uncapturederror`, and `compilationerror`
- [x] `createShaderModule` with a `compilationerror` event on a compilation failure
- [x] One-line methods for render pipelines, pipeline layouts, bind group layouts, bind groups, command encoders, and submission
- [x] `destroy`, which does not dispatch `devicelost`

## Textures

- [ ] The texture class with a resize that replaces its WebGPU object
- [ ] Depth texture ([0013](../decisions/0013-reversed-z-depth.md))

## Buffers

- [ ] The buffer class with data upload
- [ ] A resize that replaces its WebGPU object and preserves its contents when the caller requires it
- [ ] Methods of `RenderDevice` that create vertex, index, and uniform buffers

## Out of scope

Compute, storage buffers, sampled textures and samplers, indirect draws, pipeline caching, wrappers for pipelines and bind groups.

## Open questions

- How does a texture or a buffer report the replacement of its WebGPU object?
