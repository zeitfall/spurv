import { Matrix4 } from '../math/index.ts';

import { sceneRoots } from './scene-roots.ts';
import { Transform } from './transform.ts';

/**
 * A node of a scene hierarchy, positioned relative to its parent and holding an ordered list of children.
 *
 * Methods that add or remove children return this node.
 */
class SceneNode {
    #parent: SceneNode | null;
    #children: SceneNode[];

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
