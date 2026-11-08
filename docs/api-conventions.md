# API conventions

This document records the conventions that shape the public API of spurv. It complements [code-style.md](code-style.md), which governs the form of the code, and it relies on the terms defined there. The math value types of [0005](decisions/0005-math-conventions.md), such as `Vector3`, `Quaternion`, and `Matrix4`, are value types in the sense of the code style.

## Vocabulary

Beyond the general exceptions of the code style, the following short forms may appear in names that are visible outside a function body:

- the vector components `x`, `y`, `z`, and `w`;
- matrix elements, written as `m` followed by the row and the column index, both counted from 0: `m00`, `m23`;
- the acronyms `GPU`, `URL`, `JSON`, `WGSL`, `GLTF`, `RGB`, `RGBA`, `HDR`, `UV`, `NDC`, and `LOD`;
- the interpolation terms `lerp` (linear interpolation) and `slerp` (spherical linear interpolation), either alone or within a compound identifier such as `inverseLerp`.

Within the library, `math` is the module that implements mathematical formulas and may therefore name its local variables after their notation.

The `GPU` prefix belongs to WebGPU, so no class, interface, or type alias in spurv begins with it.

## Units

Angles are expressed in radians throughout the API, `fieldOfView` included, and are converted with `degreesToRadians()` and `radiansToDegrees()`. Distances are expressed in meters and time in seconds. Milliseconds reported by browser APIs are converted to seconds where they enter the library.

## Standard methods

Every copyable type provides the methods below, with the same names and semantics. The signature `set(x, y, z)` is the form used by `Vector3`; other types take their own components.

| Method                             | Semantics                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `set(x, y, z)`                     | Assigns the components                                                    |
| `setFromArray(array, offset = 0)`  | Assigns the components read from an `ArrayLike<number>`                   |
| `copy(source)`                     | Copies the value of an instance of the same type                          |
| `clone()`                          | Creates a new instance with the same value                                |
| `equals(other, tolerance = 0)`     | Determines whether every component differs by at most `tolerance`         |
| `notEquals(other, tolerance = 0)`  | Determines whether `equals` is false                                      |
| `writeToArray(target, offset = 0)` | Writes the components into the given array without allocating, returns it |

Methods that assign the receiver from another representation, such as `setFromArray` or `setFromAxisAngle`, belong to the assignment group and follow `set`, while `writeToArray` belongs to the conversion group.

## Copy and write

The verb names the kind of destination, as it does in WebGPU (`writeBuffer`, `copyBufferToBuffer`). `copy` transfers a value into an instance of its own type: `copy(source)` copies into `this`, whereas a method that copies one of the receiver's values into a given instance names that value and ends in `To`, as in `node.copyWorldMatrixTo(target)`. `write`, by contrast, transfers components into an array or a typed array, and a method that writes a value other than the receiver itself names that value: `writeWorldMatrixToArray(target, offset = 0)`. In both cases the method returns its target.

## Operations

A binary operation combines `this` with its operand and stores the result in `this`, so `a.subtract(b)` sets `a` to `a - b`. Two-operand variants such as `addVectors` or `multiplyMatrices` do not exist; a result that involves several operands is composed by chaining instead: `target.copy(a).add(b)`. Because the multiplication of matrices and of quaternions is not commutative, these types also offer `premultiply(operand)`, which multiplies in the opposite order, so that `a.premultiply(b)` sets `a` to `b * a`.

A method that transforms a vector by a matrix is named after the class of the transformation. `transformLinear(matrix)` applies only the upper-left 3x3 block and is therefore suited to directions; `transformAffine(matrix)` assumes the bottom row `(0, 0, 0, 1)` and is suited to points; `transformProjective(matrix)` additionally divides by `w`.

A method that sets the receiver to a named value or a standard construction of its type is named with the noun alone, without a verb: `identity()`, `perspective()`.

## Degenerate input

Math value types handle degenerate input as [0005](decisions/0005-math-conventions.md) defines. In particular, a method whose result does not exist for its input leaves the receiver unchanged; this is the case when a zero vector or quaternion is normalized, or when a zero quaternion or a singular matrix is inverted.

## GPU errors

GPU errors, whether validation errors, out-of-memory conditions, device loss, or shader compilation failures, are always surfaced to the caller and never ignored.

## Enumerations

When an enum object mirrors a WebGPU enumeration, each value is the WebGPU string, as in `TextureFormat.RGBA8_UNORM = 'rgba8unorm'`, so the value passes to the API without mapping.

## Module-level state

Module-level GPU resources are forbidden in particular. A resource belongs to one `GPUDevice`, so a module-level cache would outlive device loss and mix the resources of two renderers. Such state is a field of the scene, renderer, or device that owns it.
