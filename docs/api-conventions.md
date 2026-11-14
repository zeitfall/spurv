# API conventions

This document defines the naming and semantics of the public API of spurv. It relies on the terms defined in [code-style.md](code-style.md), which governs the form of the code. The math value types of [0005](decisions/0005-math-conventions.md), such as `Vector3`, `Quaternion`, and `Matrix4`, are value types in the sense of the code style.

## Vocabulary

In addition to the short forms that the code style permits ([code-style.md](code-style.md#abbreviations)), the following short forms may appear in names:

- the vector components `x`, `y`, `z`, and `w`;
- matrix elements, written as `m` followed by the row and the column index, both counted from 0: `m00`, `m23`;
- the acronyms `GPU`, `URL`, `JSON`, `WGSL`, `GLTF`, `RGB`, `RGBA`, `HDR`, `UV`, `NDC`, and `LOD`;
- the interpolation terms `lerp` (linear interpolation) and `slerp` (spherical linear interpolation), either alone or within a compound identifier such as `inverseLerp`.

The mathematical module of the library is `math`. It is the only module whose code names local variables after the notation of a formula ([code-style.md](code-style.md#abbreviations)).

No class, interface, or type alias begins with the prefix `GPU`, which WebGPU reserves ([code-style.md](code-style.md#prohibited-names)).

## Units

- Angles are expressed in radians throughout the API, `fieldOfView` included. They are converted with `degreesToRadians()` and `radiansToDegrees()`.
- Distances are expressed in meters.
- Time is expressed in seconds. Milliseconds reported by browser APIs are converted to seconds where they enter the library.

## Standard methods

Every copyable type provides the methods below, with the same names and semantics. The table shows the signatures of `Vector3`. Another type takes its own components and names the parameter of `copy`, `equals`, and `notEquals` after its own kind ([code-style.md](code-style.md#parameters)).

| Method                                 | Semantics                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `set(x, y, z)`                         | Assigns the components                                                              |
| `setFromArray(array, arrayOffset = 0)` | Assigns the components read from an `ArrayLike<number>`                             |
| `copy(vector)`                         | Copies the value of an instance of the same type                                    |
| `clone()`                              | Creates a new instance with the same value                                          |
| `equals(vector, tolerance = 0)`        | Determines whether every component differs by at most `tolerance`                   |
| `notEquals(vector, tolerance = 0)`     | Determines whether `equals` is false                                                |
| `writeToArray(array, arrayOffset = 0)` | Writes the components into the given array without allocating and returns the array |

- The parameter `arrayOffset` of `setFromArray` and `writeToArray` is the index of the first element in the given array.
- Methods that assign the receiver from another representation, such as `setFromArray` or `setFromAxisAngle`, belong to the assignment group and follow `set` ([code-style.md](code-style.md#method-order)).
- `writeToArray` belongs to the conversion group.

## Copy and write

The verb of a method names the kind of its destination and states whether the call performs a computation.

- `copy` transfers a value that the receiver holds into an instance of the type of that value. `copy(vector)` copies into `this`. A method that copies one of the values of the receiver into a given instance names that value and ends in `To`: `node.copyWorldMatrixTo(matrix)`.
- `write` transfers the components of a value that the receiver holds into an array or a typed array. A method that writes a value other than the receiver itself names that value: `writeWorldMatrixToArray(array, arrayOffset = 0)`.
- `compute` derives a value on every call and stores it in a given instance. Such a method names that value, ends in `Into`, and takes its target as the first parameter: `camera.computeViewMatrixInto(matrix)`.
- Each of these methods returns its target.

## Operations

- A binary operation combines `this` with its operand and stores the result in `this`: `a.subtract(b)` sets `a` to `a - b`.
- An operation has no variant that takes both of its operands. A result that involves several operands is composed by chaining: `target.copy(a).add(b)`.
- Matrices and quaternions also provide `premultiply(operand)`, which multiplies in the opposite order: `a.multiply(b)` sets `a` to `a * b`, and `a.premultiply(b)` sets `a` to `b * a`.
- A method that sets the receiver to a named value or a standard construction of its type is named with the noun alone: `identity()`, `perspective()`.

A method that transforms a vector by a matrix is named after the class of the transformation:

| Method                        | Semantics                                                   |
| ----------------------------- | ----------------------------------------------------------- |
| `transformLinear(matrix)`     | Applies only the upper-left 3x3 block; suited to directions |
| `transformAffine(matrix)`     | Assumes the bottom row `(0, 0, 0, 1)`; suited to points     |
| `transformProjective(matrix)` | Applies the whole matrix and divides by `w`                 |

## Degenerate input

Math value types handle degenerate input as [0005](decisions/0005-math-conventions.md) defines. A method whose result does not exist for its input leaves the receiver unchanged, as when a zero vector or quaternion is normalized, or when a zero quaternion or a singular matrix is inverted.

## GPU errors

GPU errors, whether validation errors, out-of-memory conditions, device loss, or shader compilation failures, are always surfaced to the caller and never ignored.

## Enumerations

WebGPU is an external API in the sense of [code-style.md](code-style.md#enum-objects): when an enum object mirrors a WebGPU enumeration, each value is the WebGPU string, as in `VertexFormat.FLOAT32X3 = 'float32x3'`.

## Module-level state

A GPU resource is never held at module level ([code-style.md](code-style.md#module-scope)). It is a field of the scene, renderer, or device that owns it.
