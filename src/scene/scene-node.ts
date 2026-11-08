import { Matrix4 } from '../math/index.ts';

import { sceneComponentNodes } from './scene-component-nodes.ts';
import { sceneRoots } from './scene-roots.ts';
import { Transform } from './transform.ts';

import type { SceneComponent } from './scene-component.ts';

/**
 * A node of a scene hierarchy, positioned relative to its parent and holding an ordered list of children.
 *
 * Methods that add or remove children or components return this node.
 */
class SceneNode {
    #parent: SceneNode | null;
    #children: SceneNode[];

    #components: Map<Function, SceneComponent>;

    #transform: Transform;
    #worldMatrix: Matrix4;
    #worldMatrixVersion: number;

    #snapshotLocalMatrixVersion: number;
    #snapshotParentWorldMatrixVersion: number;

    /**
     * Creates a node without a parent and without children.
     */
    constructor() {
        this.#parent = null;
        this.#children = [];

        this.#components = new Map();

        this.#transform = new Transform();
        this.#worldMatrix = new Matrix4();
        this.#worldMatrixVersion = 0;

        this.#snapshotLocalMatrixVersion = -1;
        this.#snapshotParentWorldMatrixVersion = -1;
    }

    /**
     * The node that contains this node, or null if this node is detached.
     */
    get parent() {
        return this.#parent;
    }

    /**
     * The position, rotation, and scale of this node relative to its parent.
     */
    get transform() {
        return this.#transform;
    }

    /**
     * The counter that increases each time the world matrix of this node changes.
     *
     * @remarks Two readings that differ indicate a change, so the matrices need not be compared.
     */
    get worldMatrixVersion() {
        return this.#worldMatrixVersion;
    }

    // Hierarchy --------------------------------------------------------------

    /**
     * Appends the given node to the children of this node.
     *
     * @param child - The node to append.
     *
     * @throws RangeError if the given node is this node, an ancestor of this node, or the root of a
     * scene.
     *
     * @remarks If the given node already has a parent, it is first removed from that parent, so a node
     * that is already a child of this node moves to the end.
     */
    addChild(child: SceneNode) {
        if (sceneRoots.has(child)) {
            throw new RangeError('SceneNode.addChild: expected a node that is not a scene root, received a scene root.');
        }

        let ancestor: SceneNode | null = this;

        while (ancestor !== null) {
            if (ancestor === child) {
                throw new RangeError('SceneNode.addChild: expected a node that is neither this node nor its ancestor, received this node or its ancestor.');
            }

            ancestor = ancestor.#parent;
        }

        if (child.#parent !== null) {
            child.#parent.removeChild(child);
        }

        child.#parent = this;
        child.#snapshotParentWorldMatrixVersion = -1;

        this.#children.push(child);

        return this;
    }

    /**
     * Removes the given node from the children of this node.
     *
     * @param child - The node to remove.
     *
     * @throws RangeError if the given node is not a child of this node.
     */
    removeChild(child: SceneNode) {
        if (child.#parent !== this) {
            throw new RangeError('SceneNode.removeChild: expected a child of this node, received a node that is not its child.');
        }

        const childIndex = this.#children.indexOf(child);

        this.#children.splice(childIndex, 1);

        child.#parent = null;
        child.#snapshotParentWorldMatrixVersion = -1;

        return this;
    }

    /**
     * Creates an iterator over the children of this node, in the order of their appending.
     *
     * @remarks Adding or removing children during the iteration can cause nodes to be skipped or
     * repeated.
     */
    children() {
        return this.#children.values();
    }

    // Components -------------------------------------------------------------

    /**
     * Appends the given component to this node.
     *
     * @param component - The component to append.
     *
     * @throws RangeError if the given component is attached to another node, or if this node already
     * holds a component of the same class.
     */
    addComponent(component: SceneComponent) {
        const componentNode = component.node;

        if (componentNode !== null && componentNode !== this) {
            throw new RangeError('SceneNode.addComponent: expected a component that is not attached to another node, received a component attached to another node.');
        }

        const componentAlreadyExists = this.#components.has(component.constructor);

        if (componentAlreadyExists) {
            throw new RangeError('SceneNode.addComponent: expected a component of a class that this node does not hold, received a component of a class that it holds.');
        }

        sceneComponentNodes.set(component, this);
        this.#components.set(component.constructor, component);

        return this;
    }

    /**
     * Removes the given component from this node.
     *
     * @param component - The component to remove.
     *
     * @throws RangeError if the given component is not attached to this node.
     */
    removeComponent(component: SceneComponent) {
        const componentNode = component.node;

        if (componentNode !== this) {
            throw new RangeError('SceneNode.removeComponent: expected a component of this node, received a component that is not attached to it.');
        }

        sceneComponentNodes.delete(component);
        this.#components.delete(component.constructor);

        return this;
    }

    /**
     * Looks up the component of this node that has exactly the given class.
     *
     * @typeParam T - The type of the component.
     *
     * @param componentClass - The class to look up.
     *
     * @returns The component, or null if this node holds no component of the given class.
     */
    getComponent<T extends SceneComponent>(componentClass: new (...args: never[]) => T) {
        return (this.#components.get(componentClass) ?? null) as T | null;
    }

    /**
     * Creates an iterator over the components of this node, in the order of their appending.
     *
     * @remarks Adding or removing components during the iteration can cause components to be skipped or
     * repeated.
     */
    components() {
        return this.#components.values();
    }

    // Transforms -------------------------------------------------------------

    /**
     * Updates the world matrix of this node from its own transform and the transforms of its ancestors.
     *
     * @remarks The world matrices of the descendants remain unchanged.
     */
    updateWorldMatrix() {
        if (this.#parent !== null) {
            this.#parent.updateWorldMatrix();
        }

        this.#updateWorldMatrixFromParent();
    }

    /**
     * Copies the world matrix of this node into the given matrix.
     *
     * @param target - The destination matrix.
     *
     * @returns The given matrix.
     *
     * @remarks The world matrix is recomputed only by an update, so changes to the transforms made
     * since the last update are not reflected.
     */
    copyWorldMatrixTo(target: Matrix4) {
        return target.copy(this.#worldMatrix);
    }

    /**
     * Writes the world matrix of this node into the given array, in column-major order.
     *
     * @param target - The destination array.
     * @param offset - The index of the first element.
     *
     * @returns The given array.
     *
     * @remarks The world matrix is recomputed only by an update, so changes to the transforms made
     * since the last update are not reflected.
     */
    writeWorldMatrixToArray(target: ArrayLike<number>, offset = 0) {
        return this.#worldMatrix.writeToArray(target, offset);
    }

    /**
     * Updates the world matrices of this node and all of its descendants.
     */
    updateSubtree() {
        this.updateWorldMatrix();
        this.#updateDescendants();
    }

    // Private ----------------------------------------------------------------

    #updateWorldMatrixFromParent() {
        this.#transform.updateLocalMatrix();

        let parentWorldMatrixVersion = 0;

        if (this.#parent !== null) {
            parentWorldMatrixVersion = this.#parent.#worldMatrixVersion;
        }

        const localMatrixHasChanged = this.#transform.localMatrixVersion !== this.#snapshotLocalMatrixVersion;
        const parentWorldMatrixHasChanged = parentWorldMatrixVersion !== this.#snapshotParentWorldMatrixVersion;

        if (localMatrixHasChanged || parentWorldMatrixHasChanged) {
            this.#transform.copyLocalMatrixTo(this.#worldMatrix);
            this.#worldMatrixVersion++;

            this.#snapshotLocalMatrixVersion = this.#transform.localMatrixVersion;
            this.#snapshotParentWorldMatrixVersion = parentWorldMatrixVersion;

            if (this.#parent !== null) {
                this.#worldMatrix.premultiply(this.#parent.#worldMatrix);
            }
        }
    }

    #updateDescendants() {
        for (const child of this.#children) {
            child.#updateWorldMatrixFromParent();
            child.#updateDescendants();
        }
    }
}

export { SceneNode };
