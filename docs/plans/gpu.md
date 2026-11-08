# gpu

Goal: the WebGPU layer that `renderer` requires for milestone 3 ([architecture.md](../architecture.md#milestones)).

## Device

- [ ] Asynchronous acquisition of the adapter and the device ([0002](../decisions/0002-webgpu-only.md))
- [ ] An error for an environment without WebGPU
- [ ] Surfacing of validation errors, out-of-memory conditions, and device loss ([api-conventions.md](../api-conventions.md#gpu-errors))

## Surface

- [ ] Configuration of the canvas context
- [ ] Resizing of the canvas within the texture size limit of the device
- [ ] Depth texture ([0013](../decisions/0013-reversed-z-depth.md))

## Resources

- [ ] Vertex, index, and uniform buffers with data upload
- [ ] Shader modules with surfacing of compilation failures
- [ ] Render pipelines, bind group layouts, and bind groups

## Out of scope

Compute, sampled textures and samplers, indirect draws, pipeline caching.

## Open questions

- Which WebGPU objects does the layer wrap, and which does it pass through unchanged?
