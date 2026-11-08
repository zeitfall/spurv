# 0019. Scene components

- Status: Accepted
- Date: 2026-11-08

## Context

[0003](0003-scene-graph-with-components.md) defines what a node is through the components attached to it and leaves the details of components open. The renderer of milestone 3 ([architecture.md](../architecture.md#milestones)) finds its work by querying components, so these details are required before it is built.

Several constraints shape the model. The module `scene` is in a lower layer than the modules that define concrete components, and [0010](0010-module-boundaries-and-layers.md) forbids upward imports, so a node cannot name a concrete component. The modules `geometry` and `materials` share a layer, and imports within a layer are forbidden as well, so neither can define a component that refers to the other. A scene may contain many nodes that display the same shape, and the vertices of that shape are stored only once.

Bevy, the architectural reference of the project, allows one component of each type on an entity, finds components by type, represents a mesh as the two components `Mesh3d` and `MeshMaterial3d`, which refer to shared assets, and keeps the variants of a projection inside a `Projection` type. A Bevy component is plain data that is unaware of its entity, and a Bevy query runs over grouped storage rather than over the hierarchy. spurv components, by contrast, are objects with methods, and JavaScript offers neither the value-type structs nor the shared-memory threads that make such storage profitable, as [0014](0014-scene-and-scene-nodes.md) observes.

## Decision

A component is an instance of a class that directly extends the abstract class `SceneComponent` of the module `scene`, as [0018](0018-encapsulation-and-inheritance.md) permits. `SceneComponent` exposes a read-only `node`, which is the node that holds the component or null when the component is not attached. This reference makes a component self-sufficient: a camera derives its view matrix from the world matrix of its own node.

A node holds at most one component of each class, and a component is found by its exact class, which the node uses as the key of its storage. Passing the class rather than a string preserves the type of the result and prevents collisions between names, and it also keeps `scene` unaware of the concrete classes, which dedicated fields such as `node.camera` would not. Whatever requires several components of one class is expressed with child nodes, since a node without components is inexpensive.

`SceneNode` provides `addComponent(component)` and `removeComponent(component)`, which return the node, as `addChild` and `removeChild` do. It also provides `getComponent(ComponentClass)`, which returns the component or null, and the iterator `components()`.

A component belongs to exactly one node. Adding a component throws an error when the node already holds a component of the same class or when the component is attached to any node, whereas a removed component may be attached to another node. Unlike `addChild`, which detaches its argument, and unlike Bevy, which replaces a component of the same type, `addComponent` does not resolve a conflict automatically. A single instance added to many nodes in a loop would otherwise remain on the last node only, and the other nodes would silently lose it.

The classes of components do not form hierarchies, and the variants of a component are held inside it. A `Camera` of the module `cameras` holds a `Projection`, an abstract class of the same module whose subclasses, such as `PerspectiveProjection`, build the projection matrix from their settings with the construction methods of `Matrix4`.

There is no mesh component. A renderable node carries a `GeometryComponent` of the module `geometry` and a `MaterialComponent` of the module `materials`, and the renderer draws a node only when both are present, so the two modules remain independent. These components refer to a shared `Geometry` or `Material`, which is ordinary data and not a component, so any number of nodes share one set of vertices. Among the concrete components, the suffix `Component` appears only where the name without it already denotes such data, and `Camera` therefore carries no suffix.

The renderer finds components during the extract phase ([0004](0004-frame-phases.md)) by traversing the tree from the root of the scene on every frame. A registry of components in `Scene` was rejected. It would require every node to know its scene and every change of the hierarchy to walk the affected subtree, and a defect in that bookkeeping would make objects vanish or remain after removal, while `scene.update()` already visits every node on each frame.

## Consequences

- The open questions on scene components and on the mesh component in [architecture.md](../architecture.md#open-questions) are resolved.
- The question of the `scene` plan on reattaching a removed component is resolved.
- A renderable node requires two components and is not drawn when one of them is missing, without any error. A helper function that creates both can reduce this risk later.
- Each renderable node costs two small objects in addition to the shared data.
- `Camera.projection` has the type of the abstract `Projection`, so code that changes a setting of a specific projection either retains its own reference to it or tests its class.
- The extract phase visits nodes that carry no components. A registry can replace the traversal later without a change to the public API.
- Sharing `Geometry` and `Material` between nodes allows the renderer to group draws by these objects when batching and instancing are introduced.
