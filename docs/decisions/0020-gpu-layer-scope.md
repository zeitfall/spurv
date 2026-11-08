# 0020. Scope of the GPU layer

- Status: Accepted
- Date: 2026-11-08

## Context

The module `gpu` provides the renderer with its access to WebGPU, and its plan leaves open which WebGPU objects the module wraps. WebGPU is already an explicit and usable API, and [0002](0002-webgpu-only.md) excludes a backend abstraction, so a wrapper has no second backend to conceal. [0010](0010-module-boundaries-and-layers.md) allows both `gpu` and `renderer` to use WebGPU directly and allows only `renderer` to import `gpu`, so the module serves internal code rather than the consumers of the library.

Certain work nevertheless recurs around WebGPU objects. Acquiring a device and surfacing its errors requires the same steps in every program, as [api-conventions.md](../api-conventions.md#gpu-errors) demands. The size of a `GPUTexture` or a `GPUBuffer` is immutable, so a resize destroys one object and creates another, and the depth texture of `02-hierarchy` already follows this sequence. The buffers of that example differ only in size and usage, so their creation repeats the same descriptor.

Three scopes were considered. A thin layer that wraps only the device leaves the recurring work scattered through the renderer. A thick layer with a class for every WebGPU object produces many classes that only forward calls. Bevy, the architectural reference of the project, keeps its `RenderDevice` and `Buffer` as light wrappers over wgpu objects and places the main logic above them.

## Decision

The module `gpu` wraps a WebGPU object only when the wrapper carries logic of its own. The device, textures, and buffers therefore have classes. The class of the device acquires the adapter and the device, surfaces GPU errors, and configures the canvas context, which remains a plain `GPUCanvasContext`. The renderer tracks the size of the canvas, since it replaces its depth texture whenever that size changes, so a class of the canvas context would carry no logic of its own. A texture or a buffer holds its current WebGPU object in a `#private` field and provides a resize that destroys that object and creates a replacement, and a buffer also uploads data and preserves its contents across a resize when the caller requires it.

Shader modules, render pipelines, bind group layouts, and bind groups remain plain WebGPU objects, which the renderer creates through the device. A class for one of them is introduced only when logic of its own appears.

The creation of buffers for a specific purpose, such as `createUniformBuffer(size)`, consists of methods of the device class, because a resource belongs to one `GPUDevice` and module-level GPU resources are forbidden ([api-conventions.md](../api-conventions.md#module-level-state)). Such a method exists only for a kind of buffer that the library uses, which for milestone 3 ([architecture.md](../architecture.md#milestones)) means vertex, index, and uniform buffers.

No class of the module begins with the `GPU` prefix, as the API conventions require.

## Consequences

- The open question of the `gpu` plan on the objects that the layer wraps is resolved.
- The module remains small, and the renderer sees WebGPU concepts directly, which keeps the architecture built around them as 0002 intends.
- The renderer handles both wrapped and plain WebGPU objects, so it depends on two kinds of interface.
- A resize invalidates the views and bind groups that refer to the replaced object, so a texture or a buffer has to report such a replacement. The mechanism is decided during the implementation.
- Caching of pipelines and bind groups is left to later work, and it can introduce wrappers inside `gpu` and `renderer` without a change to the public API.
