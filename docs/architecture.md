# Architecture

This document describes the current structure of the library and changes as the library grows. The rationale behind each decision is recorded in the [ADRs](decisions/README.md).

## Modules and layers

The rules for modules and layers are defined in [0010](decisions/0010-module-boundaries-and-layers.md), and a row is added to the table whenever a module is created.

| Layer | Module  | Responsibility                 | Status  |
| ----- | ------- | ------------------------------ | ------- |
| 0     | `math`  | Vectors, quaternions, matrices | Created |
| 1     | `scene` | Scene hierarchy and transforms | Created |

The planned modules are `gpu` in layer 0; `geometry`, `materials`, `cameras`, and `lights` in layer 2; and `renderer` in layer 3, which will also contain the shaders.

Three areas of the repository lie outside the layers: `src/testing` holds helpers used only by tests, `scripts/` holds the development tooling, and `examples/` holds one example per milestone.

## Milestones

A milestone is a vertical slice of the library that ends in a runnable example in `examples/`.

| # | Example              | Scope                                                                                                                  | Status  |
| - | -------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------- |
| 1 | `01-cube`            | A rotating cube. `math` only; raw WebGPU; view and projection as plain `Matrix4`.                                      | Done    |
| 2 | `02-hierarchy`       | A hierarchy of cubes and a camera node. `scene`; raw WebGPU; import checks; CI, added last.                            | Done    |
| 3 | `03-renderer`        | The scene of `02-hierarchy` through the public API. `gpu`, `renderer`, components, `cameras`, `geometry`, `materials`. | Planned |
| 4 | `04-camera-controls` | Keyboard and pointer input, orbit and fly camera controllers.                                                          | Planned |
| 5 | `05-lighting`        | `lights` and lit materials.                                                                                            | Planned |
| 6 | `06-assets`          | Textures and model loading from glTF.                                                                                  | Planned |

Shadows, a frame graph, culling, and instancing follow these milestones and are not yet scheduled.

Until `renderer` exists, an example calls WebGPU directly, since the WebGPU restriction of [0010](decisions/0010-module-boundaries-and-layers.md) applies only to `src/`.

## Open questions

This table lists the questions that span several modules; a question confined to one module is kept in the plan of that module.

| Topic              | Question                                                              | Resolved in                   |
| ------------------ | --------------------------------------------------------------------- | ----------------------------- |
| Device loss        | Automatic recovery or notification only                               | `renderer` design             |
| Shader conventions | WGSL naming and composition                                           | Shader design                 |
| Frame loop         | Which object owns the frame loop and measures the frame time          | `renderer` design             |
| Input              | Which modules and layers hold input and camera controllers            | ADR of milestone 4            |
| Asset loading      | Which module holds the texture and model loaders                      | ADR of milestone 6            |
