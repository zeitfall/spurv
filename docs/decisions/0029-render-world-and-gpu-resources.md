# 0029. Render world and GPU resources

- Status: Accepted
- Date: 2026-11-12

## Context

The renderer of milestone 3 copies the data of a frame from the scene into its own structures and uploads it to the GPU. Five questions have to be answered before it is written: whether those structures are rebuilt on every frame, how the meshes of a frame are grouped for drawing, how the vertex data of a geometry is stored on the GPU, which pipelines the renderer creates, and how the matrices of the camera and of the meshes reach the shader.

The answers build on these decisions:

- [0004](0004-frame-phases.md), frame phases: the main world of the consumer is separate from the render world of the renderer, a frame passes through the phases extract, prepare, queue, and render, and the render world holds no references to user objects.
- [0018](0018-encapsulation-and-inheritance.md), encapsulation: a class never returns an internal collection, because the read-only modifiers of TypeScript do not bind a consumer of the library.
- [0020](0020-gpu-layer-scope.md), GPU layer: `RenderDevice` gains a method for a kind of buffer when the library begins to use that kind.
- [0022](0022-render-device-resources.md), device resources: a buffer reports the replacement of its WebGPU object through a version, and WebGPU rejects a write whose length is not a multiple of 4.
- [0024](0024-geometry-and-vertex-data.md), geometry: the attributes are stored separately, an attribute and a geometry each have a version, several geometries may hold one attribute, and the renderer chooses the layout of its GPU buffers freely.
- [0026](0026-scene-components-and-meshes.md), meshes: the extract phase traverses the tree of the scene on every frame, and the scene keeps no registry of components.
- [0027](0027-renderer.md), renderer: every GPU object belongs to the renderer, and its method `destroy` destroys the device.
- [0028](0028-materials-and-shaders.md), shaders: a shader states the attributes that it requires, two materials have the same shader when they return the same descriptor, bind group 0 holds the data of the view, and bind group 1 holds the data of the meshes.

## Decision

### Render world

- The render world has two parts. The frame part holds the data of one frame: the view-projection matrix of the camera, the world matrices of the meshes, and the batches of those meshes. The retained part holds the batches and the records of GPU resources, such as buffers and pipelines.
- The frame part is rebuilt on every frame. The extract phase empties it and appends one item for each node that holds a `Mesh`. Its arrays are reused and only grow.
- The retained part persists between frames, and a record is updated when the version of its source changes.
- The extract phase is the only phase that reads the scene, its nodes, and the camera.
- The result of a phase is one object that persists between frames. The phase updates the object in place and returns it by reference, and the renderer passes it to the next phase, which only reads it. The result of the extract phase is the frame packet, and the result of the prepare phase is the frame resources.
- Such a result is not an internal collection in the sense of 0018: it never leaves the renderer, so no consumer of the library can reach it.
- The class of a phase carries the prefix `Renderer`, as a part of the renderer, and a type of the data that the phases pass to one another carries the prefix `Render`.

### Batches

- A batch is a combination of a geometry and a material. The extract phase holds one batch for each combination that a frame has contained, finds it by the geometry and then by the material, and retains it between frames.
- The frame packet lists each batch of the frame once, and a batch holds its position in that list. For each mesh, the frame packet holds the position of its batch.
- A batch refers to its geometry and its material. The prepare phase reads the vertex data, the indices, and the shader through the batch, so vertex data reaches the GPU without a copy in the render world. The phases queue and render read neither object.
- For each batch of the frame, the frame resources hold one record at the position of that batch. The record holds what a draw of the batch requires: the pipeline, the vertex buffers in the order of the attributes that the shader requires, the index buffer with the format of its indices, and the number of indices, or of vertices for a geometry without indices.
- The frame resources hold the bind groups of the camera and of the meshes once, because both are the same for every batch.
- The prepare phase iterates the batches and not the meshes, so its work on GPU resources does not grow with the number of meshes that share a batch.

### Vertex and index buffers

- Each vertex attribute occupies one GPU buffer, and its array is uploaded without a copy.
- The prepare phase holds two fields of the kind `WeakMap`: one from a `VertexAttribute` to the record of its vertex buffer, and one from a `Geometry` to the record of its index buffer. A record holds the buffer and the version of the data that the buffer contains.
- A vertex buffer is written again when the version of its attribute changes. An attribute that no shader requires is not uploaded.
- An index buffer is replaced by a buffer that is created with the indices when the version of its geometry changes, because the byte length of 16-bit indices is not always a multiple of 4. The index buffer of a geometry that has lost its indices is destroyed.
- Milestone 3 gives the consumer no method that releases the buffers of an attribute or of a geometry. The method `destroy` of the renderer destroys the device and every buffer with it. The buffer of an attribute or a geometry that becomes unreachable is released by the browser at an unspecified time.

### Pipelines

- The prepare phase creates one shader module for each shader descriptor.
- The prepare phase creates one pipeline for each combination of a shader descriptor and the formats of the vertex attributes that the shader requires. Every other property of a pipeline is the same in milestone 3.
- Every pipeline has the same pipeline layout, which consists of the bind group layouts of the camera and of the meshes. A render pass therefore binds both groups once.

### Camera and world matrices

- The extract phase writes the view-projection matrix of the camera into a `Float32Array`, and the prepare phase uploads it into one uniform buffer, which is bound in group 0.
- The world matrices of all meshes of a frame occupy one storage buffer, which is bound in group 1.
- The extract phase writes each matrix into one `Float32Array`, which converts it to 32-bit floats, and the prepare phase uploads that array with one write.
- The shader reads the matrix of a mesh by the instance index, and the draw call of a mesh passes the index of that mesh as its first instance.
- The buffer grows when a frame holds more meshes than it admits, and it does not shrink. The bind group of the meshes is created again when the buffer is replaced.
- `RenderDevice` gains the methods that create a storage buffer.

### Rejected alternatives

- A frame part that persists and is updated from the transform versions, as in Bevy since its version 0.15: the traversal visits every node in either case, and the renderer would have to detect removed nodes.
- A result object that the renderer owns and a phase fills: every phase would take one input object and one output object, and the input objects would exist only to give the phases one form.
- A copy of the vertex data in the frame packet, which would keep every object of the consumer out of the render world: each change of an attribute would be copied once into the render world and once to the GPU.
- The bind groups of the camera and of the meshes in each batch record: every record would have to follow the replacement of the storage buffer.
- One interleaved vertex buffer for each geometry, as in Bevy: every change of an attribute would require a packing copy.
- A pipeline for each geometry: geometries of the same formats would hold equal pipelines, and the draw list could not place their meshes together.
- A uniform buffer with an array of a fixed size, as in `02-hierarchy`: its default limit is 1024 matrices.
- A buffer and a bind group for each mesh: their number would grow with the number of meshes.
- One buffer with a dynamic offset for each draw, as in Filament: every draw would require a call that binds the group, and a matrix of 64 bytes would occupy 256.

## Consequences

- The open questions of the `renderer` plan on the render world, on the objects that a batch refers to, on the buffers of a geometry, on the pipelines, and on the world matrices are resolved.
- The code style gains the rule that an object that holds only the result of a method on a hot path is not an internal collection.
- Nothing prevents a phase from changing the result of an earlier phase, so the rule that a result is only read rests on convention.
- The consequence of 0004 that the render world holds no references to user objects applies to the scene, its nodes, its components, and the camera. A geometry and a material are referred to by a batch, so the phases extract and prepare of a frame run within one call of `render`, with no code of the consumer between them.
- A frame costs time in proportion to the number of meshes even when nothing moves. A retained frame part can replace the rebuilt one later without a change to the public API.
- The layout of one buffer for each attribute is not final. An interleaved buffer can read vertices faster on the GPU for large models, whereas separate buffers favor a pass that reads positions only. The layout is reconsidered on measurements once the library renders such models, and the public API does not change.
- A shader cannot require more than 8 attributes, which is the default limit of vertex buffers in a pipeline.
- An application that creates and drops many large geometries cannot bound its GPU memory. An explicit release requires a new ADR.
- A call to `setAttribute` changes the version of the geometry, so the indices are uploaded again although they did not change.
- A property that comes to differ between pipelines, such as the culling of a material, joins the combination that identifies a pipeline.
- The meshes of one batch that are adjacent in the storage buffer can later be drawn by one call.
