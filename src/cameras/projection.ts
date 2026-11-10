import type { Matrix4 } from '../math/index.ts';

/**
 * A mapping of the view of a camera onto a render target.
 */
abstract class Projection {
    /**
     * Computes the matrix of this projection for the given aspect ratio into the given matrix.
     *
     * @param target - The destination matrix.
     * @param aspectRatio - The ratio of the width of the render target to its height.
     *
     * @returns The given matrix.
     */
    abstract computeMatrixInto(target: Matrix4, aspectRatio: number): Matrix4;
}

export { Projection };
