# 0021. Render device

- Status: Accepted
- Date: 2026-11-08

## Context

[0020](0020-gpu-layer-scope.md) gives the module `gpu` a class of the device, which acquires the adapter and the device and surfaces GPU errors, and through which the renderer creates its resources. It leaves the form of that class open.

Several properties of WebGPU shape this form. The acquisition of an adapter and a device is asynchronous, whereas a constructor cannot be. Most GPU errors arrive asynchronously, through the `uncapturederror` event and the `lost` promise, so they cannot be thrown at the call that caused them, and yet [api-conventions.md](../api-conventions.md#gpu-errors) requires that they reach the caller. A shader module is returned at once even when its WGSL is invalid, and the details of the failure are available only through the asynchronous `getCompilationInfo`. Finally, `GPUDevice.destroy` resolves the same `lost` promise as an unexpected loss, and only the `reason` of the result distinguishes the two.

## Decision

The class is named `RenderDevice`. The `GPU` prefix is reserved for WebGPU, a bare `Device` is too general to identify the class outside its module, and Bevy, the architectural reference of the project, uses the same name.

A device is created by the asynchronous static method `create`, which queries `navigator.gpu`, requests the adapter and the device, and throws an error when WebGPU or an adapter is unavailable. Its optional `RenderDeviceOptions` has the fields `adapterOptions` of type `GPURequestAdapterOptions` and `deviceDescriptor` of type `GPUDeviceDescriptor`, which pass to WebGPU unchanged, so every present and future setting is available without logic in the library. The constructor accepts a `GPUDevice` that is already acquired, so an instance is never partially initialized. A separate initialization method was rejected because every other method would then have to verify readiness.

`RenderDevice` is the single entry point for creating GPU resources, and its `GPUDevice` is a `#private` field without a getter. Operations that carry no logic of their own, such as `createRenderPipeline` or `submit`, are one-line methods, and such a method is added only when the renderer requires that operation. The classes of the module that need the `GPUDevice`, such as those of textures and buffers, are created by `RenderDevice` and receive it from there. The method `createCanvasContext` obtains the context of a canvas, configures it with the `GPUDevice`, and returns it as a plain `GPUCanvasContext`, and it throws an error when the canvas provides no such context. The getter `limits` exposes the limits of the device, by which the renderer bounds the size of a canvas. Bevy also offers a getter for the underlying object. spurv omits it, because a second path to the same resources could bypass any logic later placed in the single path. Collaborators private to `RenderDevice`, such as a pipeline cache, are introduced together with the first state that requires them, and the public methods then delegate to them without a change for the renderer.

`RenderDevice` reports errors through `addEventListener` and `removeEventListener`, as `GPUDevice` does, with the event types `devicelost`, `uncapturederror`, and `compilationerror`, which are separate so that the `detail` of each event has an exact type. It holds an `EventTarget` in the `#private` field `#eventTarget` rather than extending the class, since [0018](0018-encapsulation-and-inheritance.md) does not permit that inheritance and an inherited `addEventListener` cannot narrow its event types. Events received from WebGPU are dispatched as new event objects, because an event in the course of dispatch cannot be dispatched again.

`createShaderModule` is synchronous, so the synchronous frame phases of [0004](0004-frame-phases.md) can call it. It returns the module at once, queries `getCompilationInfo` in the background, and dispatches a `compilationerror` event that contains the compilation information when the compilation fails.

The method `destroy` destroys the device. The event `devicelost` is dispatched only for an unexpected loss and not when the `reason` is `destroyed`, since only `destroy` can produce that reason while the `GPUDevice` remains private. Whether the library recovers from a loss automatically remains a decision of the renderer design ([architecture.md](../architecture.md#open-questions)).

## Consequences

- The renderer has one source of GPU resources, and a cache can later be placed behind it without a change to its callers.
- Each WebGPU operation that the renderer uses requires a short method on `RenderDevice`.
- A listener attached in the same synchronous block as the completion of `create` misses no event, whereas code that omits the `devicelost` listener receives no notification of a loss.
- An invalid shader can produce both a `compilationerror` event and an `uncapturederror` event, the latter from the validation of a pipeline that uses it.
- A compilation failure is reported after the call to `createShaderModule` has returned, so it does not appear at the call site.
