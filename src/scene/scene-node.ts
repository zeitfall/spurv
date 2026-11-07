import { Matrix4 } from '../math/index.ts';

import { sceneRoots } from './scene-roots.ts';
import { Transform } from './transform.ts';

/**
 * An object in a scene, placed relative to its parent node and able to hold child nodes.
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
     * The parent node, or null for a node without a parent.
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
     * The number of times the world matrix has changed.
     */
    get worldMatrixVersion() {
        return this.#worldMatrixVersion;
    }

    // Hierarchy --------------------------------------------------------------

    /**
     * Appends the given node to the children of this node.
     *
     * @param child - The appended node.
     *
     * @throws RangeError if the given node is this node, an ancestor of this node, or the root of a scene.
     *
     * @remarks A node that already has a parent leaves it, and a child of this node moves to the end.
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
     * @param child - The removed node.
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
     * Creates an iterator over the children of this node, in order.
     *
     * @remarks Changing the children during the iteration skips or repeats nodes.
     */
    children() {
        return this.#children.values();
    }

    // Transforms -------------------------------------------------------------

    /**
     * Applies the current transforms of this node and its ancestors to the world matrix of this node.
     *
     * @remarks The descendants of this node are not updated.
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
     * @remarks The copy does not include changes made after the last world matrix update.
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
     * @remarks The array does not include changes made after the last world matrix update.
     */
    writeWorldMatrixToArray(target: ArrayLike<number>, offset: number) {
        return this.#worldMatrix.writeToArray(target, offset);
    }

    /**
     * Applies the current transforms to the world matrices of this node and all its descendants.
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
