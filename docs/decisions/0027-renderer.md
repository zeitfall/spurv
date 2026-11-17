# 0027. Renderer

- Status: Accepted
- Date: 2026-11-11

## Context

Milestone 3 introduces the module `renderer`. Its public form has to be decided before any code: how a consumer creates a renderer, which object owns the frame loop, how the camera and the size of the canvas reach the renderer, and what happens when the device is lost.

The answers build on these decisions:

- [0004](0004-frame-phases.md), frame phases: the renderer copies the data of a frame from the main world of the consumer into its own render world.
- [0010](0010-module-boundaries-and-layers.md), layers: only `renderer` imports `gpu`, so `RenderDevice` is not part of the public API.
- [0021](0021-render-device.md), render device: `RenderDevice` is created by an asynchronous static method, and it reports errors through the events `devicelost`, `uncapturederror`, and `compilationerror`.
- [0022](0022-render-device-resources.md), device resources: a texture is resized by a replacement, and a resize to the current size does nothing.
- [0023](0023-camera-and-projection.md), cameras: the renderer passes the aspect ratio to the camera, a camera without a node throws an error, and the renderer does not write to the main world.

## Decision

### Creation

- A renderer is created by the asynchronous static method `Renderer.create(canvas)`, which accepts an `HTMLCanvasElement`. A constructor cannot be asynchronous.
- The method creates a `RenderDevice` and configures the WebGPU context of the canvas with the format that the browser prefers. It throws when WebGPU, an adapter, or the context is unavailable.
- The method accepts no options. The first option becomes its second parameter.
- The renderer owns its `RenderDevice` and does not expose it.
- The method `destroy` destroys the GPU objects of the renderer and its device.

### Frame

- The library owns no frame loop. The consumer calls `scene.update()` and then `renderer.render(scene, camera)` whenever a frame is required.
- The method `render` does not call `scene.update()`, because it would then write to the main world.
- The method `render` accepts the camera, so the renderer holds no active camera.
- A setting that belongs to one view of a scene, such as a viewport, a render target, or a clear color, never becomes mutable state of the renderer. It becomes a member of the camera or of an object that is passed to `render`. The clear color of milestone 3 is a constant of the renderer.

### Canvas size

- The consumer assigns the width and the height of the canvas, and the renderer follows them. At the start of every `render`, it resizes its depth texture to the size of the canvas and derives the aspect ratio from that size.
- For a canvas without area, `render` returns without drawing.
- The getter `maxCanvasSizePerDimension` returns the largest value that the device permits for the width and for the height of the canvas.

### Errors

- The renderer does not recover from the loss of its device. It reports the loss, and the consumer creates a new renderer for the same canvas.
- After a loss, `render` returns without drawing, because frames continue while the new renderer is created. After `destroy`, `render` throws an `Error`.
- `Renderer` provides `addEventListener` and `removeEventListener` with the three event types of `RenderDevice` and forwards these calls to its device.

### Rejected alternatives

- A public `RenderDevice` that the consumer passes to the renderer: every method of `gpu` would become public API.
- A frame loop inside the renderer: it would exclude rendering on demand and several renderers in one loop.
- Cameras that the renderer finds in the scene, as in Bevy: every camera would need an order, an activity flag, and a target.
- Methods of the renderer that assign the settings of a view: the order of the calls would carry the logic of a frame with several views.
- A `ResizeObserver` or a method that assigns the size inside the renderer: the resolution of a canvas is a policy of the page, and a change of the size clears the canvas.
- Automatic recovery from the loss of a device: milestone 3 has no automatic GPU tests that could verify it.

## Consequences

- The open questions of [architecture.md](../architecture.md#open-questions) on the loss of a device and on the frame loop are resolved. The measurement of the frame time is decided together with input in milestone 4.
- Two canvases require two renderers and two devices, and a geometry that both display is uploaded twice.
- A frame without a preceding `scene.update()` is drawn from the world matrices of the last update, without any error.
- A camera whose node is outside the given scene is not updated by `scene.update()`, and the renderer does not detect it.
- A canvas that exceeds `maxCanvasSizePerDimension` is not rejected by the renderer and causes a GPU error.
- A consumer that omits the `devicelost` listener receives no notification of a loss and sees a canvas that no longer changes.
- The listeners of a renderer do not pass to the renderer that replaces it after a loss.
- The `target` of an event is an object of the device and not the renderer, and the details of the events are objects of WebGPU, so the public API contains these types.
- Automatic recovery, several views of one canvas, and options of the device can be introduced later without a breaking change.
