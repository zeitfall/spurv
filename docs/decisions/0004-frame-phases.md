# 0004. Frame phases and render world

- Status: Accepted
- Date: 2026-10-27

## Context

If the renderer reads user scene objects directly, the GPU-side code is coupled to the user-facing API, and optimizations such as batching, instancing, and GPU culling require API changes.

## Decision

Separate the user-facing *main world* from an internal *render world*. Each frame passes through explicit phases (after Bevy):

1. **Extract**: copy the data needed for the frame from the main world into flat render-world structures. f64 → f32 conversion happens here.
2. **Prepare**: upload data to GPU buffers and create or update GPU resources.
3. **Queue**: build draw commands, sorted and grouped by pipeline.
4. **Render**: execute passes. A frame graph will replace this phase later (Frostbite FrameGraph, GDC 2017).

## Consequences

- The render world holds no references to user objects.
- Each phase is testable in isolation.
- The renderer can be rewritten without breaking the public API.
- The extract copy costs memory and time each frame.
