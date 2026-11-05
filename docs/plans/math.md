# math

Goal: the math required by milestone 1 ([architecture.md](../architecture.md#milestones)).

## Testing

- [x] `assertClose`, `assertArrayClose` in `src/testing`

## Scalar

- [x] `clamp`, `lerp`, `inverseLerp`

## Vector3

- [x] Standard methods ([code-style.md](../code-style.md#standard-methods)), including `setFromArray`, `writeToArray`
- [x] `add`, `subtract`, `multiply`, `scale`, `negate`
- [x] `dot`, `cross`
- [x] `length`, `lengthSquared`, `distance`, `normalize`
- [x] `lerp`

## Quaternion

- [x] Standard methods, `identity`
- [x] `setFromAxisAngle`
- [x] `multiply`, `premultiply`
- [x] `scale`, `length`, `lengthSquared`, `normalize`, `conjugate`, `invert`
- [x] `dot`, `slerp`. Source: K. Shoemake, "Animating Rotation with Quaternion Curves", 1985.

## Matrix4

- [x] Standard methods, `identity`
- [x] `multiply`, `premultiply`
- [x] `transpose`, `determinant`, `invert`
- [x] `setFromQuaternion`, `compose(position, rotation, scale)`
- [x] `perspective` ([0013](../decisions/0013-reversed-z-depth.md)). Matches glam `Mat4::perspective_rh` with the near and far distances swapped in the depth row.

## Angles

- [ ] `degreesToRadians`, `radiansToDegrees`

## Out of scope

`Vector2`, `Vector4`, `Matrix3`, `lookAt`, `decompose`, Euler conversion, vector-by-matrix transforms, geometric primitives.
