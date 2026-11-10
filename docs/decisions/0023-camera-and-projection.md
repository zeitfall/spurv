# 0023. Camera and projection

- Status: Accepted
- Date: 2026-11-10

## Context

[0019](0019-scene-components.md) defines `Camera` as a component of the module `cameras` that holds a `Projection`, and [0018](0018-encapsulation-and-inheritance.md) permits `Projection` as an abstract contract inside that module. Both leave the members of these classes open, and the plan of the module asks whether the aspect ratio is a property of the camera or a value that the renderer derives from its render target.

Several constraints shape the answer. A perspective projection depends on the aspect ratio of the surface that displays it. That surface belongs to the renderer, which tracks the size of the canvas because it replaces its depth texture whenever that size changes ([0020](0020-gpu-layer-scope.md)). The module `cameras` is in a lower layer than `renderer` and cannot import it ([0010](0010-module-boundaries-and-layers.md)), so a camera cannot read the size of a render target. The extract phase copies data out of the main world ([0004](0004-frame-phases.md)), and it is the only point at which the renderer reads a camera. A getter runs in constant time and has no side effects ([code-style.md](../code-style.md#accessors-and-methods)), so a derived matrix cannot be recomputed when it is read, and a derived matrix is never returned by reference ([0014](0014-scene-and-scene-nodes.md)). The world matrix of a node, from which the view matrix is derived, changes only during an update ([0015](0015-transform-versions.md)).

Bevy, the architectural reference of the project, stores the aspect ratio in its `PerspectiveProjection`, and a system of the engine assigns it through the method `update(width, height)` of the projection whenever the size of the render target changes.

## Decision

The aspect ratio is state neither of the camera nor of the projection. The renderer derives it from the size of its render target during the extract phase and passes it as an argument to the methods below. Two alternatives were rejected. A property that the consumer assigns has to be assigned again after every change of the size of the canvas, and an omission produces a distorted image without any error. A property that the renderer assigns, as in Bevy, makes the extract phase write to an object of the main world, and it gives a camera a single aspect ratio even when two render targets of different shapes display it.

`Projection` declares the single abstract method `computeMatrixInto(target, aspectRatio)`, which computes the projection matrix for the given aspect ratio into the given matrix and returns that matrix. The aspect ratio is the ratio of the width of the render target to its height, as in `Matrix4.perspective`. The base class holds no state, because the single subclass of milestone 3 ([architecture.md](../architecture.md#milestones)) does not show which state later subclasses share.

`PerspectiveProjection` extends `Projection`. Its constructor accepts `fieldOfView`, `nearDistance`, and `farDistance`, and the class exposes each of them through a getter and assigns it through the methods `setFieldOfView`, `setNearDistance`, and `setFarDistance`, as [code-style.md](../code-style.md#accessors-and-methods) requires. The names repeat the parameters of `Matrix4.perspective`, the field of view is vertical, and the units follow [api-conventions.md](../api-conventions.md#units). All three parameters are required, because suitable distances depend on the scale of the scene, and three positional parameters remain within the limit of [code-style.md](../code-style.md#parameters). The constructor and these methods throw a `RangeError` for a field of view outside `(0, pi)` and for a distance that is not positive and finite. The relation between the two distances is not validated, because each distance is assigned separately and such a check would make the order of two assignments significant. `computeMatrixInto` calls `Matrix4.perspective`, so the matrix has the reversed depth of [0013](0013-reversed-z-depth.md). The method runs on every frame and therefore validates nothing, and equal distances or an aspect ratio of zero leave the given matrix unchanged, as `Matrix4.perspective` documents.

`Camera` extends `SceneComponent` directly. Its constructor accepts a `Projection`, which the getter `projection` exposes, and the method `setProjection` replaces the projection while the camera remains on its node. The method `computeViewMatrixInto(target)` computes the inverse of the world matrix of the node of the camera into the given matrix. The method `computeViewProjectionMatrixInto(target, aspectRatio)` computes the product of the projection matrix and the view matrix, in that order, which transforms world space into clip space. Both methods return the given matrix. The three methods begin with `compute` and not with `copy`, because neither class stores the matrix that it provides ([api-conventions.md](../api-conventions.md#copy-and-write)). `Camera` has no method for the projection matrix alone, since `camera.projection.computeMatrixInto` already provides it.

The view matrix is the complete inverse of the world matrix, so it includes the scale of the node and of its ancestors, and it reflects the state of the last update, as `copyWorldMatrixTo` does. A singular world matrix yields that matrix itself, because `Matrix4.invert` leaves a singular matrix unchanged ([0005](0005-math-conventions.md)).

The methods `computeViewMatrixInto` and `computeViewProjectionMatrixInto` throw an `Error` when the camera is attached to no node. This is not a validation of an argument, which a hot path omits. Reading the node already requires a comparison with null, since the code style forbids a non-null assertion, and the only choice is the result of that branch. An identity view matrix was rejected, because a detached camera would then render from the origin of the world and conceal a missing call to `addComponent`.

The matrices are computed on every call, and neither class stores them. A cache with a version, in the manner of 0015, was rejected. It requires an update method that either the consumer or the renderer calls before every read, and the projection matrix depends on an argument that is not state of the camera, so a cached matrix would be valid for one aspect ratio only. The computation consists of one inversion and one product of matrices for each camera on each frame.

## Consequences

- The open question of the `cameras` plan on the aspect ratio is resolved.
- A camera requires no synchronization with the canvas, and one camera serves render targets of different shapes.
- A camera cannot provide a projection matrix by itself. Code outside the renderer that requires one, such as the conversion of a pointer position into a ray, supplies the aspect ratio.
- The renderer is responsible for an aspect ratio that is positive and finite, so it does not extract a camera for a render target without area.
- The contract of `Projection` departs from Bevy and conveys only the ratio of the render target. A projection that depends on the size of the target in pixels, such as an orthographic projection that maps one unit to one pixel, requires a new ADR that changes this contract.
- A near distance greater than the far distance is not rejected, and it produces a depth mapping that contradicts 0013.
- A scale on the node of a camera or on one of its ancestors scales the view, and a scale that is not uniform distorts the image.
- A consumer that reads the matrices of a camera several times within a frame repeats the computation each time, and it can avoid a repetition by comparing the `worldMatrixVersion` of the node.
- A detached camera that reaches the renderer stops the frame with an error.
