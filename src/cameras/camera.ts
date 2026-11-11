import { Matrix4 } from '../math/index.ts';
import { SceneComponent } from '../scene/index.ts';

import type { Projection } from './projection.ts';

/**
 * A component that views the scene from its node through a projection.
 */
class Camera extends SceneComponent {
    #projection: Projection;

    /**
     * Creates a camera with the given projection.
     *
     * @param projection - The projection of the camera.
     */
    constructor(projection: Projection) {
        super();

        this.#projection = projection;
    }

    /**
     * The projection through which this camera views the scene.
     */
    get projection() {
        return this.#projection;
    }

    /**
     * Sets this camera to the given projection.
     *
     * @param projection - The projection to use.
     */
    setProjection(projection: Projection) {
        this.#projection = projection;

        return this;
    }

    /**
     * Computes the view matrix of this camera into the given matrix.
     *
     * @param matrix - The destination matrix.
     *
     * @returns The given matrix.
     *
     * @throws Error if this camera is not attached to a node.
     *
     * @remarks The world matrix of the node is recomputed only by an update, so changes to the transforms
     * made since the last update are not reflected.
     * @remarks A singular world matrix of the node yields that world matrix.
     */
    computeViewMatrixInto(matrix: Matrix4) {
        const node = this.node;

        if (node === null) {
            throw new Error('Camera.computeViewMatrixInto: expected a camera attached to a node, received a detached camera.');
        }

        return node.copyWorldMatrixTo(matrix).invert();
    }

    /**
     * Computes the view-projection matrix of this camera for the given aspect ratio into the given matrix.
     *
     * @param matrix - The destination matrix.
     * @param aspectRatio - The ratio of the width of the render target to its height.
     *
     * @returns The given matrix.
     *
     * @throws Error if this camera is not attached to a node.
     *
     * @remarks The world matrix of the node is recomputed only by an update, so changes to the transforms
     * made since the last update are not reflected.
     */
    computeViewProjectionMatrixInto(matrix: Matrix4, aspectRatio: number) {
        this.#projection.computeMatrixInto(matrix, aspectRatio);
        this.computeViewMatrixInto(_matrix4A);

        return matrix.multiply(_matrix4A);
    }
}

const _matrix4A = new Matrix4();

export { Camera };
