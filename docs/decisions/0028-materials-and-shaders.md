# 0028. Materials and shaders

- Status: Accepted
- Date: 2026-11-14

## Context

Milestone 3 requires one material and one shader. Three questions have to be answered before either is written: which object holds the shader of a material, how the vertex attributes of a geometry reach the inputs of a shader, and which conventions the WGSL source follows.

The answers build on these decisions:

- [0010](0010-module-boundaries-and-layers.md), layers: a module imports only modules of lower layers, and imports within a layer are forbidden.
- [0017](0017-toolchain-and-examples.md), toolchain: shader code is kept in TypeScript string literals.
- [0018](0018-encapsulation-and-inheritance.md), inheritance: an abstract class may have subclasses inside its own module, which implement its abstract members.
- [0024](0024-geometry-and-vertex-data.md), geometry: a geometry names its attributes with `VertexAttributeName` and assigns no shader locations, and the name of an attribute does not fix its format.
- [0026](0026-scene-components-and-meshes.md), meshes: a `Mesh` refers to a `Geometry` and a `Material`.

## Decision

### Materials

- The module `materials` provides the abstract class `Material` and the material `NormalMaterial`, which colors a surface by its normal and has no parameters. The name `UnlitMaterial` is left for a later material that has a color.
- A material states its shader, as the type of a material does in Bevy and the definition of a material in Filament. `Material` declares the abstract getter `shader`, and each class of material implements it.
- The getter of a class returns one descriptor, which is a module constant. Two materials have the same shader when their getters return the same descriptor object, and the renderer creates its GPU objects once for each descriptor.
- The renderer reads the shader from the material and names no class of material.

### Shaders

- A shader is described by a `ShaderDescriptor`, a frozen object that holds the WGSL code and the names of the vertex attributes that the shader requires.
- The shader of a material belongs to the module `materials`.
- The module `shaders` holds what every shader shares: the type `ShaderDescriptor`, the table of shader locations, and the parts of WGSL code that declare the bind groups of the camera and of the meshes.
- The type `ShaderDescriptor` is a part of the public API, because the signature of `Material` contains it. The other exports of `shaders` are internal to the library.

### Layers

- The shader of a material depends on the shader locations and on the bind groups, so `shaders` lies below `materials`.
- `shaders` is in layer 3 and imports `geometry`. `materials` takes layer 4 in place of the planned layer 2, `meshes` moves to layer 5, and `renderer` to layer 6.

### Vertex inputs

- One table of the module `shaders` gives each `VertexAttributeName` a shader location: `POSITION` is 0, `NORMAL` is 1, and `UV` is 2. A name has the same location in every shader, as in Filament.
- A pipeline contains only the attributes that its shader requires.
- The pipeline takes the format of an attribute from the geometry.

### WGSL

- Identifiers follow the naming of [code-style.md](../code-style.md#naming): a structure is written in PascalCase and every other identifier in camelCase. A quantity therefore has one name in TypeScript and in WGSL.
- Source is composed from TypeScript string constants, which a shader includes through a template literal. The shader locations are interpolated from the table above.
- Bind group 0 holds the data of the view, group 1 the data of the meshes, and group 2 the data of the material. This is the order of Filament and Bevy: the layouts of groups 0 and 1 are the same in every pipeline, and the layout that varies comes last.

### Errors

- A geometry that lacks an attribute that the shader of its material requires causes an `Error` in `render`.

### Rejected alternatives

- One class `Material` with a type from an enum object: the parameters of every kind of material would share one class.
- A table in the renderer from the class of a material to its shader: every new material would change `renderer`, and a material that a consumer defines would have no entry.
- A static member of the class of a material, after the type-level methods of Bevy: TypeScript cannot require a static member of a subclass, and the renderer would read it through `constructor`.
- A descriptor that the constructor of `Material` accepts and stores: every material would carry a field for a value that its class determines.
- The shared shader code inside `renderer` or inside `materials`: `materials` lies below `renderer` and could not import it from there, and the code declares the bind groups that the renderer creates, so it belongs to no material.
- Shader locations that each shader assigns, as in Bevy: one relation would be repeated in every shader.
- A preprocessor with imports and conditions, as in Bevy: milestone 3 has one shader without variants.
- Group 1 for the material and group 2 for the meshes: `NormalMaterial` has no parameters, so group 1 would be empty.

## Consequences

- The open question of the `materials` plan is resolved, as are the questions of the `renderer` plan on shader locations and WGSL conventions and the question of [architecture.md](../architecture.md#open-questions) on shader conventions.
- A new material requires a class and a shader in `materials`, and it requires no change to `renderer`.
- A getter that returns a new descriptor on each call causes the renderer to compile a shader and to create a pipeline for each of these descriptors, without any error.
- The library does not yet support a material that a consumer defines. Such a material requires the public export of the shared code and of the shader locations, a statement of the WGSL conventions as a public contract, and a third permitted form of inheritance in addition to those of 0018. It requires a new ADR and no change to the renderer.
- The parameters of a material, such as a color, belong to its instance and occupy bind group 2. Their layout extends the descriptor and requires a new ADR.
- The renderer does not compare the format of an attribute with the shader input. That check becomes necessary with the first format that is not a 32-bit float, in milestone 6.
- The set of attribute names cannot exceed 16, which is the default limit of a device.
- Variants of one shader require a new ADR.
