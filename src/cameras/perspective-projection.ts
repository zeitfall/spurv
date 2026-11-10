import { Projection } from './projection.ts';

import type { Matrix4 } from '../math/index.ts';

/**
 * A projection in which distant objects appear smaller, defined by a field of view and two clipping distances.
 *
 * Methods that assign a property return this projection.
 */
class PerspectiveProjection extends Projection {
    #fieldOfView: number;
    #nearDistance: number;
    #farDistance: number;

    /**
     * Creates a perspective projection with the given field of view and clipping distances.
     *
     * @param fieldOfView - The vertical field of view.
     * @param nearDistance - The distance to the near clipping plane.
     * @param farDistance - The distance to the far clipping plane.
     *
     * @throws RangeError if the given field of view is not greater than zero and less than pi, or if a given
     * distance is not positive and finite.
     *
     * @remarks The field of view is in radians, and the distances are in meters.
     */
    constructor(fieldOfView: number, nearDistance: number, farDistance: number) {
        super();

        assertFieldOfView(fieldOfView, 'constructor');
        assertDistance(nearDistance, 'constructor');
        assertDistance(farDistance, 'constructor');

        this.#fieldOfView = fieldOfView;
        this.#nearDistance = nearDistance;
        this.#farDistance = farDistance;
    }

    /**
     * The vertical field of view of this projection.
     *
     * @remarks The field of view is in radians.
     */
    get fieldOfView() {
        return this.#fieldOfView;
    }

    /**
     * The distance to the near clipping plane of this projection.
     *
     * @remarks The distance is in meters.
     */
    get nearDistance() {
        return this.#nearDistance;
    }

    /**
     * The distance to the far clipping plane of this projection.
     *
     * @remarks The distance is in meters.
     */
    get farDistance() {
        return this.#farDistance;
    }

    /**
     * Sets this projection to the given field of view.
     *
     * @param fieldOfView - The vertical field of view.
     *
     * @throws RangeError if the given field of view is not greater than zero and less than pi.
     *
     * @remarks The field of view is in radians.
     */
    setFieldOfView(fieldOfView: number) {
        assertFieldOfView(fieldOfView, 'setFieldOfView');

        this.#fieldOfView = fieldOfView;

        return this;
    }

    /**
     * Sets this projection to the given near distance.
     *
     * @param nearDistance - The distance to the near clipping plane.
     *
     * @throws RangeError if the given distance is not positive and finite.
     *
     * @remarks The distance is in meters.
     */
    setNearDistance(nearDistance: number) {
        assertDistance(nearDistance, 'setNearDistance');

        this.#nearDistance = nearDistance;

        return this;
    }

    /**
     * Sets this projection to the given far distance.
     *
     * @param farDistance - The distance to the far clipping plane.
     *
     * @throws RangeError if the given distance is not positive and finite.
     *
     * @remarks The distance is in meters.
     */
    setFarDistance(farDistance: number) {
        assertDistance(farDistance, 'setFarDistance');

        this.#farDistance = farDistance;

        return this;
    }

    /**
     * Computes the matrix of this projection for the given aspect ratio into the given matrix.
     *
     * @param target - The destination matrix.
     * @param aspectRatio - The ratio of the width of the render target to its height.
     *
     * @returns The given matrix.
     *
     * @remarks The matrix maps the near clipping plane to a depth of 1 and the far clipping plane to a depth of 0.
     * @remarks An aspect ratio of zero leaves the given matrix unchanged, and so do equal clipping distances.
     */
    computeMatrixInto(target: Matrix4, aspectRatio: number) {
        return target.perspective(this.#fieldOfView, aspectRatio, this.#nearDistance, this.#farDistance);
    }
}

function assertFieldOfView(fieldOfView: number, caller: string) {
    if (Number.isNaN(fieldOfView) || fieldOfView <= 0 || fieldOfView >= Math.PI) {
        throw new RangeError(`PerspectiveProjection.${caller}: expected a field of view in (0, pi), received ${fieldOfView}.`);
    }
}

function assertDistance(distance: number, caller: string) {
    if (distance <= 0 || Number.isFinite(distance) === false) {
        throw new RangeError(`PerspectiveProjection.${caller}: expected a positive and finite distance, received ${distance}.`);
    }
}

export { PerspectiveProjection };
