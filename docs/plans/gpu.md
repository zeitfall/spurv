# gpu

Goal: the WebGPU layer that `renderer` requires for milestone 3 ([architecture.md](../architecture.md#milestones)), within the scope of [0020](../decisions/0020-gpu-layer-scope.md) and in the form of [0021](../decisions/0021-render-device.md) and [0022](../decisions/0022-render-device-resources.md).

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

- [ ] `RenderDeviceTexture` with `create`, the getters `raw`, `view`, and `version`, `resize`, and `destroy`
- [ ] `RenderDevice.createDepthTexture` that returns a `RenderDeviceTexture` without additional usage flags ([0013](../decisions/0013-reversed-z-depth.md))

## Buffers

- [ ] `RenderDeviceBuffer` with `create`, `createWithData`, the getters `raw` and `version`, `write`, `resize`, and `destroy`
- [ ] Methods of `RenderDevice` that create vertex, index, and uniform buffers and return a `RenderDeviceBuffer` without additional usage flags
- [ ] `createVertexBufferWithData`, `createIndexBufferWithData`, and `createUniformBufferWithData` of `RenderDevice`

## Out of scope

Compute, storage buffers, sampled textures and samplers, indirect draws, pipeline caching, wrappers for pipelines and bind groups, preservation of the contents of a buffer across a resize.
