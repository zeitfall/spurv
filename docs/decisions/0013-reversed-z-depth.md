# 0013. Reversed-Z depth

- Status: Accepted
- Date: 2026-11-01

## Context

- A perspective projection maps view distance to depth in `[0, 1]` ([0002](0002-webgpu-only.md)) in proportion to its reciprocal. Most of the depth range is spent near the near plane, and distant geometry is compressed toward the far value.
- Floating-point depth formats (`depth32float`) are densest near 0 and sparsest near 1.
- With the conventional mapping (near plane at 0, far plane at 1), both effects concentrate error at large distances, which produces z-fighting.
- Mapping the near plane to 1 and the far plane to 0 makes the two effects largely cancel, giving nearly uniform precision across the view distance. Source: N. Reed, "Depth Precision Visualized", 2015.

## Decision

- Depth is reversed: the near plane maps to 1 and the far plane to 0. This is the only convention. There is no option for the conventional mapping.
- `Matrix4.perspective` produces a reversed-Z projection.
- Render pipelines compare depth with `'greater'` (or `'greater-equal'` where equal depth must pass), depth attachments are cleared to 0, and depth textures use `depth32float`.

## Consequences

- Depth precision is nearly uniform across the view distance.
- Every depth test, clear value, and depth read assumes reversed-Z: shadow maps, depth-based effects, picking. Formulas from sources that use the conventional mapping are adapted before use.
- Integer depth formats would gain little from reversal. They are not used.
- Examples that call WebGPU directly, such as `01-cube`, use the same settings.
