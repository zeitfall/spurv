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

- [ ] Standard methods, `identity`
- [ ] `setFromAxisAngle`
- [ ] `multiply`, `premultiply`
- [ ] `length`, `lengthSquared`, `normalize`, `conjugate`, `invert`
- [ ] `dot`, `slerp`

## Matrix4

- [ ] Standard methods, `identity`
- [ ] `multiply`, `premultiply`
- [ ] `transpose`, `determinant`, `invert`
- [ ] `compose(position, rotation, scale)`
- [ ] `perspective`

## Angles

- [ ] `degreesToRadians`, `radiansToDegrees`

## Out of scope

`Vector2`, `Vector4`, `Matrix3`, `lookAt`, `decompose`, Euler conversion, vector-by-matrix transforms, geometric primitives.

## Open questions

- Reversed-Z in `perspective`. Source: N. Reed, "Depth Precision Visualized", 2015.
