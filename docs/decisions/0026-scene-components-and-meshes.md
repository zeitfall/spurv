# 0026. Scene components and meshes

- Status: Accepted
- Date: 2026-11-11

## Context

This ADR supersedes [0019](0019-scene-components.md). It keeps the component model of 0019 and changes only the representation of a renderable node, which becomes a single component.

[0003](0003-scene-graph-with-components.md) defines what a node is through the components attached to it and leaves the details of components open. The renderer of milestone 3 ([architecture.md](../architecture.md#milestones)) finds its work by querying components, so these details are required before it is built.

Several constraints shape the model. The module `scene` is in a lower layer than the modules that define concrete components, and [0010](0010-module-boundaries-and-layers.md) forbids upward imports, so a node cannot name a concrete component. The modules `geometry` and `materials` share a layer, and imports within a layer are forbidden as well, so neither can define a component that refers to the other, although a module of a higher layer can. A scene may contain many nodes that display the same shape, and the vertices of that shape are stored only once.

0019 concluded from the second constraint that a renderable node carries two components, one of `geometry` and one of `materials`. Its own consequences state the cost: a node that carries only one of the two is not drawn, without any error, and each renderable node holds two objects. Each of these components would also consist of nothing but a reference, so a `GeometryComponent` would expose a `geometry` and a method `setGeometry` and have no content of its own, and a setting that belongs to the pair, such as visibility, would have no place.

Bevy, the architectural reference of the project, allows one component of each type on an entity, finds components by type, and keeps the variants of a projection inside a `Projection` type. It represents a mesh as the two components `Mesh3d` and `MeshMaterial3d`, which refer to shared assets. The type of the material is a type parameter of `MeshMaterial3d`, and each type of material is drawn by systems that query for its own component, so this separation serves the queries of Bevy. A Bevy component is plain data that is unaware of its entity, and a Bevy query runs over grouped storage rather than over the hierarchy. spurv components, by contrast, are objects with methods, and JavaScript offers neither the value-type structs nor the shared-memory threads that make such storage profitable, as [0014](0014-scene-and-scene-nodes.md) observes.

In Bevy, the term `Mesh` denotes the vertex data of a shape. In glTF, which milestone 6 loads, a mesh consists of primitives, each of which pairs vertex data with a material.

## Decision

A component is an instance of a class that directly extends the abstract class `SceneComponent` of the module `scene`, as [0018](0018-encapsulation-and-inheritance.md) permits. `SceneComponent` exposes a read-only `node`, which is the node that holds the component or null when the component is not attached. This reference makes a component self-sufficient: a camera derives its view matrix from the world matrix of its own node.

A node holds at most one component of each class, and a component is found by its exact class, which the node uses as the key of its storage. Passing the class rather than a string preserves the type of the result and prevents collisions between names, and it also keeps `scene` unaware of the concrete classes, which dedicated fields such as `node.camera` would not. Whatever requires several components of one class is expressed with child nodes, since a node without components is inexpensive.

`SceneNode` provides `addComponent(component)` and `removeComponent(component)`, which return the node, as `addChild` and `removeChild` do. It also provides `getComponent(ComponentClass)`, which returns the component or null, and the iterator `components()`.

A component belongs to exactly one node. Adding a component throws an error when the node already holds a component of the same class or when the component is attached to any node, whereas a removed component may be attached to another node. Unlike `addChild`, which detaches its argument, and unlike Bevy, which replaces a component of the same type, `addComponent` does not resolve a conflict automatically. A single instance added to many nodes in a loop would otherwise remain on the last node only, and the other nodes would silently lose it.

The classes of components do not form hierarchies, and the variants of a component are held inside it. A `Camera` of the module `cameras` holds a `Projection`, an abstract class of the same module whose subclasses, such as `PerspectiveProjection`, build the projection matrix from their settings with the construction methods of `Matrix4`.

A renderable node carries the single component `Mesh`, which refers to a `Geometry` of the module `geometry` and to a `Material` of the module `materials`. Its constructor accepts both, the getters `geometry` and `material` expose them, and the methods `setGeometry` and `setMaterial` replace them while the mesh remains on its node. Both are required, so a mesh never lacks one of them, and the renderer draws every node that holds a `Mesh`. `Geometry` and `Material` are ordinary data and not components, so any number of meshes share one set of vertices.

`Mesh` belongs to the new module `meshes` in layer 3, which imports `scene`, `geometry`, and `materials`, and `renderer` moves to layer 4. The modules `geometry` and `materials` therefore remain independent of each other, which is the purpose that the two components of 0019 served. The two components were rejected for the costs that the context states, and because the reason for which Bevy separates them, a query for each type of material, does not exist where a component is found by its exact class. A `Mesh` inside `renderer` was rejected as well, because a component belongs to the main world, and a scene is then assembled and tested without the module that holds the render world and uses WebGPU.

A concrete component carries the suffix `Component` only where the name without it already denotes other data of the library. Neither `Camera` nor `Mesh` does, so both carry no suffix. The term follows glTF and departs from Bevy, whose `Mesh` corresponds to `Geometry`.

The renderer finds components during the extract phase ([0004](0004-frame-phases.md)) by traversing the tree from the root of the scene on every frame. The traversal belongs to the renderer and uses `children()` and `getComponent()`, so `scene` provides no method of traversal, and the renderer remains free to skip a subtree. A registry of components in `Scene` was rejected. It would require every node to know its scene and every change of the hierarchy to walk the affected subtree, and a defect in that bookkeeping would make objects vanish or remain after removal, while `scene.update()` already visits every node on each frame.

## Consequences

- A renderable node always has both a geometry and a material, and it costs one component in addition to the shared data.
- The library gains the module `meshes`, which consists of one class, and the layer of `renderer` increases by one. [architecture.md](../architecture.md#modules-and-layers) is updated accordingly.
- The modules `geometry` and `materials` define no components.
- A setting that belongs to the pair of a geometry and a material, such as visibility, can later become a member of `Mesh`.
- Code that requires only the geometry of a node, such as picking, reads it through the `Mesh` of that node.
- A mesh of glTF that consists of several primitives requires one node for each primitive, since a node holds one `Mesh`. A mesh that holds several pairs requires a new ADR.
- `Camera.projection` has the type of the abstract `Projection`, so code that changes a setting of a specific projection either retains its own reference to it or tests its class.
- The extract phase visits nodes that carry no components. A registry can replace the traversal later without a change to the public API.
- Sharing `Geometry` and `Material` between meshes allows the renderer to group draws by these objects when batching and instancing are introduced.
- [0018](0018-encapsulation-and-inheritance.md) and [0023](0023-camera-and-projection.md) refer to 0019 for the component model. On acceptance of this ADR, those links are updated to this ADR as an editorial correction, since the model they rely on is now stated here.
