# 0005. Math conventions

- Status: Accepted
- Date: 2026-10-27

## Context

- Immutable vectors allocate on every operation, which causes GC pressure in real-time code.
- Functional out-parameter APIs (`vec3.add(out, a, b)`) are explicit but verbose.
- V8 optimizes monomorphic call sites. Inheritance in hot math code makes them polymorphic.
- f32 accumulates error across hierarchical transforms and loses precision far from the origin.

## Decision

- Mutable classes. Instance methods write to `this` and return `this`, which enables chaining.
- No inheritance between math types: `Vector4` does not extend `Vector3`.
- CPU precision is f64. Vectors and quaternions store plain `x`, `y`, `z`, `w` fields. Matrices store a `Float64Array`.
- Matrices are column-major, matching WGSL `mat4x4f`.
- Conversion to f32 happens only when data is copied for upload to the GPU ([0004](0004-frame-phases.md)).
- World and view space: right-handed, Y-up. The camera looks down −Z. This matches glTF, so assets load without axis conversion.
- Clip space is defined by WebGPU: NDC is left-handed (+Z points into the screen) and depth is `[0, 1]` ([0002](0002-webgpu-only.md)). The projection matrix performs the handedness flip.
- Temporaries in hot paths use module-scope scratch instances. `clone()` stays out of hot paths.
- These classes are *math value types*. Their component fields are public because they carry no invariants ([0007](0007-runtime-encapsulation.md)).
- Degenerate input (zero-length vector, singular matrix, antipodal quaternions) never throws and never produces NaN. Each method produces a finite result that is chosen deliberately and documented in its TSDoc. Example: normalizing a zero-length vector leaves it unchanged. Degeneracy checks compare against exact zero; no scale-dependent epsilon is used.

## Consequences

- Allocation-free chaining.
- Aliasing is possible (`a.add(a)`, shared references). [0006](0006-transform-change-tracking.md) and [0007](0007-runtime-encapsulation.md) mitigate it for scene objects.
- f64 enables camera-relative rendering for large worlds.
- Degenerate data from legitimate runtime states (coincident points, idle input) neither crashes the frame nor propagates NaN. Callers that must detect degeneracy check it explicitly.
