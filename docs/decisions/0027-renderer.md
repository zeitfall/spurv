# 0027. Renderer

- Status: Proposed
- Date: 2026-11-11

## Context

Milestone 3 ([architecture.md](../architecture.md#milestones)) introduces the module `renderer`, and its plan requires answers to two open questions of [architecture.md](../architecture.md#open-questions) before any code: whether the library recovers from the loss of a device, and which object owns the frame loop. The form in which a consumer creates a renderer, sizes its canvas, selects a camera, and receives GPU errors is open as well.

Several earlier decisions constrain the answers. The creation of a renderer is asynchronous ([0002](0002-webgpu-only.md)), whereas a constructor cannot be. Only `renderer` imports `gpu` ([0010](0010-module-boundaries-and-layers.md)), so `RenderDevice` ([0021](0021-render-device.md)) is not part of the public API. The renderer tracks the size of the canvas, because it replaces its depth texture whenever that size changes ([0020](0020-gpu-layer-scope.md)), and a resize of a texture to its current size does nothing ([0022](0022-render-device-resources.md)). The renderer passes the aspect ratio to the camera, a detached camera throws an error, and the extract phase does not write to the main world ([0023](0023-camera-and-projection.md)). A geometry and a material hold no GPU objects ([0024](0024-geometry-and-vertex-data.md)), and neither does a scene, so every GPU object belongs to the renderer and can be created again from the main world ([0004](0004-frame-phases.md)). GPU errors always reach the caller ([api-conventions.md](../api-conventions.md#gpu-errors)).

Several properties of the platform matter as well. The loss of a device invalidates every object that the device created. Neither side of a canvas may exceed the largest texture dimension of the device, a change of the size of a canvas clears it, and the depth attachment of a render pass has to match the size of its color attachment.

Bevy, the architectural reference of the project, is an engine that owns the schedule of a frame. Its cameras are entities, and a camera carries a viewport, an order, an activity flag, and a clear color, so the engine renders every active camera of the world without a call from the application. Filament, by contrast, leaves the frame to the application, which calls `Renderer::render` with a `View`. A `View` encompasses all the state that the rendering of a scene requires, namely the scene, the camera, the viewport, and the rendering parameters.

## Decision

The class `Renderer` of the module `renderer` is created by the asynchronous static method `create(canvas)`, which accepts an `HTMLCanvasElement`. The method creates a `RenderDevice`, configures the WebGPU context of the canvas with the format that the browser prefers, and passes both to the constructor, which therefore never produces a partially initialized instance, as in 0021. It throws the errors of `RenderDevice` when WebGPU or an adapter is unavailable or when the canvas provides no WebGPU context. The method accepts no options, because milestone 3 requires none, and the first option becomes its second parameter.

The renderer owns its `RenderDevice` and does not expose it. A public `RenderDevice` that the consumer passes to the renderer was rejected. It requires a change to the import rule of 0010, and it turns every method of the module `gpu` into public API, whereas its only gain is a device that several canvases share. Such a device can later become a parameter of `create` without a breaking change.

The library owns no frame loop. A consumer calls `scene.update()` and then `renderer.render(scene, camera)` whenever a frame is required, from an animation frame callback or on demand. A loop inside the renderer was rejected, because the renderer of milestone 3 requires no time, and a renderer without a loop also serves rendering on demand and several renderers in one loop. The measurement of the frame time is decided together with input in milestone 4, where it is first required. The method `render` does not call `scene.update()`, because it would then write to the main world, which 0023 excludes for the extract phase.

The method `render(scene, camera)` accepts a `Scene` and a `Camera`, so the renderer holds no active camera. Bevy finds its cameras in the world, and this was rejected. It requires an order, an activity flag, and a target on every camera, and it belongs to an engine that owns the frame, whereas the frame here belongs to the consumer.

A setting that belongs to one view of a scene, such as a viewport, a render target, or a clear color, never becomes mutable state of the renderer. When such a setting is introduced, it becomes a member of the camera, as in Bevy, or of an object that is passed to `render`, as the `View` of Filament. Methods of the renderer that assign such settings were rejected, because a frame of several views then becomes a sequence of assignments in which the order of the calls carries the logic and a mistake produces no error. The clear color of milestone 3 is a constant of the renderer.

The consumer assigns the width and the height of the canvas, and the renderer follows them. At the start of every `render`, the renderer resizes its depth texture to the size of the canvas, which costs nothing while that size is unchanged, and it derives the aspect ratio from the same size. For a canvas without area, `render` returns without drawing, as 0023 requires. The getter `maxCanvasSize` exposes the largest width and height that the device permits, so that the consumer can bound the canvas. The renderer therefore holds no `ResizeObserver`. An observer inside the renderer was rejected, because the resolution of a canvas is a policy of the page, and because a change of the size clears the canvas, so the code that changes the size also decides when the next frame is drawn, which is the consumer once the frame belongs to it. A method that assigns the size was rejected as well, because the canvas would then have two owners and the renderer would still have to compare the sizes in `render`.

The renderer does not recover from the loss of its device. It reports the loss, and the consumer creates a new renderer for the same canvas, which restores every GPU object from the main world. Automatic recovery was rejected for milestone 3. It makes every field of the renderer replaceable, it introduces an asynchronous state between the loss and the new device, it still has to report a failure when no adapter remains, and the milestone has no automatic GPU tests that could verify it. After a loss, `render` returns without drawing, because the creation of the new renderer is asynchronous and frames continue in the meantime, so an error would end the frame loop of a consumer that handles the loss correctly. After `destroy`, by contrast, `render` throws an `Error`, since such a call is always a defect of the calling code, as a detached camera is in 0023.

`Renderer` provides `addEventListener` and `removeEventListener` with the event types `devicelost`, `uncapturederror`, and `compilationerror` of `RenderDevice`, and it forwards these calls to its device. The method `destroy` destroys the GPU objects of the renderer and its device.

## Consequences

- The open questions of [architecture.md](../architecture.md#open-questions) on the loss of a device and on the frame loop are resolved, and the measurement of the frame time moves to the question on input.
- The constructor of `Renderer` requires a `RenderDevice`, which a consumer cannot obtain, so `create` is the only way to a renderer.
- Two canvases require two renderers and two devices, and a geometry that both display is uploaded twice.
- A frame without a preceding `scene.update()` is drawn from the world matrices of the last update, without any error.
- A camera whose node is not a descendant of the root of the given scene is not updated by `scene.update()`, and the renderer does not detect it.
- The consumer writes the code that sizes the canvas, and the example of milestone 3 contains it. A canvas that exceeds `maxCanvasSize` is not rejected by the renderer and causes a GPU error.
- A consumer that omits the `devicelost` listener receives no notification of a loss and sees a canvas that no longer changes.
- The listeners of a renderer do not pass to the renderer that replaces it after a loss.
- The `target` of an event is an object of the device and not the renderer.
- The details of the events are objects of WebGPU, so the public API contains these types.
- Automatic recovery, several views of one canvas, and options of the device can be introduced later without a breaking change.
- The renderer departs from Bevy in the ownership of the frame and in the selection of the camera.
