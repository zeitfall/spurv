# Architecture

This is a living document of the current structure. The rationale for each decision is in [decisions/](decisions/README.md).

## Modules and layers

The rules are defined in [0010](decisions/0010-module-boundaries-and-layers.md). Rows are added as modules are created.

| Layer | Module   | Responsibility                    | Status  |
| ----- | -------- | --------------------------------- | ------- |
| 0     | `math`   | Vectors, quaternions, matrices    | Created |
| 1     | `scene`  | Scene hierarchy and transforms    | Created |

Planned: `gpu` (layer 0), `geometry`, `materials`, `cameras`, `lights` (2), `renderer` (3). Shaders live in `renderer`.

Outside the layers:

- `src/testing`: test-only helpers.
- `scripts/`: development tooling.
- `examples/`: one example per milestone.

## Milestones

A milestone is a vertical slice that ends in a runnable example in `examples/`.

| #   | Example        | Scope                                                                                       |
| --- | -------------- | ------------------------------------------------------------------------------------------- |
| 1   | `01-cube`      | A rotating cube. `math` only; raw WebGPU; view and projection as plain `Matrix4`.           |
| 2   | `02-hierarchy` | A hierarchy of cubes and a camera node. `scene`; raw WebGPU; import checks; CI, added last. |

Until `renderer` exists, an example calls WebGPU directly. The WebGPU restriction of [0010](decisions/0010-module-boundaries-and-layers.md) applies to `src/`.

## Open questions

Questions confined to one module are kept in its plan.

| Topic                | Question                                                                                          | Resolved in      |
| -------------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| Scene components     | Are several components of one type allowed? How are components found?                            | First components |
| Device loss          | Automatic recovery or notification only                                                           | `renderer` design |
| Shader conventions   | WGSL naming and composition                                                                       | Shader design    |
