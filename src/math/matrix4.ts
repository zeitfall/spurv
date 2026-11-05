import type { Vector3 } from './vector3.ts';
import type { Quaternion } from './quaternion.ts';

/**
 * A four-by-four matrix stored in column-major order.
 *
 * Methods modify this matrix and return it unless stated otherwise.
 */
class Matrix4 {
    #elements: Float64Array;

    /**
     * Creates an identity matrix.
     */
    constructor() {
        this.#elements = new Float64Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    /**
     * The array that stores the elements of this matrix in column-major order.
     */
    get elements() {
        return this.#elements;
    }

    /**
     * Computes the determinant of this matrix.
     */
    get determinant() {
        const m = this.#elements;

        const m00 = m[0];
        const m01 = m[4];
        const m02 = m[8];
        const m03 = m[12];
        const m10 = m[1];
        const m11 = m[5];
        const m12 = m[9];
        const m13 = m[13];
        const m20 = m[2];
        const m21 = m[6];
        const m22 = m[10];
        const m23 = m[14];
        const m30 = m[3];
        const m31 = m[7];
        const m32 = m[11];
        const m33 = m[15];

        const c00 = (
            m11 * (m22 * m33 - m23 * m32) -
            m12 * (m21 * m33 - m23 * m31) +
            m13 * (m21 * m32 - m22 * m31)
        );

        const c01 = -(
            m10 * (m22 * m33 - m23 * m32) -
            m12 * (m20 * m33 - m23 * m30) +
            m13 * (m20 * m32 - m22 * m30)
        );

        const c02 = (
            m10 * (m21 * m33 - m23 * m31) -
            m11 * (m20 * m33 - m23 * m30) +
            m13 * (m20 * m31 - m21 * m30)
        );

        const c03 = -(
            m10 * (m21 * m32 - m22 * m31) -
            m11 * (m20 * m32 - m22 * m30) +
            m12 * (m20 * m31 - m21 * m30)
        );

        return m00 * c00 + m01 * c01 + m02 * c02 + m03 * c03;
    }

    // Assignment -------------------------------------------------------------

    /**
     * Sets this matrix to the given elements in row-major order.
     *
     * @param m00 - The element in row 0, column 0.
     * @param m01 - The element in row 0, column 1.
     * @param m02 - The element in row 0, column 2.
     * @param m03 - The element in row 0, column 3.
     * @param m10 - The element in row 1, column 0.
     * @param m11 - The element in row 1, column 1.
     * @param m12 - The element in row 1, column 2.
     * @param m13 - The element in row 1, column 3.
     * @param m20 - The element in row 2, column 0.
     * @param m21 - The element in row 2, column 1.
     * @param m22 - The element in row 2, column 2.
     * @param m23 - The element in row 2, column 3.
     * @param m30 - The element in row 3, column 0.
     * @param m31 - The element in row 3, column 1.
     * @param m32 - The element in row 3, column 2.
     * @param m33 - The element in row 3, column 3.
     */
    set(
        m00: number, m01: number, m02: number, m03: number,
        m10: number, m11: number, m12: number, m13: number,
        m20: number, m21: number, m22: number, m23: number,
        m30: number, m31: number, m32: number, m33: number,
    ) {
        const m = this.#elements;

        m[0] = m00; m[1] = m10; m[2] = m20; m[3] = m30;
        m[4] = m01; m[5] = m11; m[6] = m21; m[7] = m31;
        m[8] = m02; m[9] = m12; m[10] = m22; m[11] = m32;
        m[12] = m03; m[13] = m13; m[14] = m23; m[15] = m33;

        return this;
    }

    /**
     * Sets this matrix to the identity matrix.
     */
    identity() {
        return this.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }

    /**
     * Sets this matrix to the elements read in column-major order from the given array.
     *
     * @param array - The source array.
     * @param offset - The index of the first element.
     *
     * @remarks An absent element is read from the identity matrix.
     */
    setFromArray(array: ArrayLike<number>, offset = 0) {
        return this.set(
            array[offset + 0] ?? 1, array[offset + 4] ?? 0, array[offset + 8] ?? 0, array[offset + 12] ?? 0,
            array[offset + 1] ?? 0, array[offset + 5] ?? 1, array[offset + 9] ?? 0, array[offset + 13] ?? 0,
            array[offset + 2] ?? 0, array[offset + 6] ?? 0, array[offset + 10] ?? 1, array[offset + 14] ?? 0,
            array[offset + 3] ?? 0, array[offset + 7] ?? 0, array[offset + 11] ?? 0, array[offset + 15] ?? 1,
        );
    }

    /**
     * Sets this matrix to the rotation represented by the given quaternion.
     *
     * @param quaternion - The rotation.
     */
    setFromQuaternion(quaternion: Quaternion) {
        const x = quaternion.x;
        const y = quaternion.y;
        const z = quaternion.z;
        const w = quaternion.w;

        const xx = x * x;
        const xy = x * y;
        const xz = x * z;
        const xw = x * w;

        const yy = y * y;
        const yz = y * z;
        const yw = y * w;

        const zz = z * z;
        const zw = z * w;

        return this.set(
            1 - 2 * (yy + zz), 2 * (xy - zw), 2 * (xz + yw), 0,
            2 * (xy + zw), 1 - 2 * (xx + zz), 2 * (yz - xw), 0,
            2 * (xz - yw), 2 * (xw + yz), 1 - 2 * (xx + yy), 0,
            0, 0, 0, 1,
        );
    }

    /**
     * Sets this matrix to the transformation that scales, rotates, and then translates by the
     * given values.
     *
     * @param position - The translation.
     * @param rotation - The rotation.
     * @param scale - The scale factors along the X, Y, and Z axes.
     */
    compose(position: Vector3, rotation: Quaternion, scale: Vector3) {
        this.setFromQuaternion(rotation);

        const m = this.#elements;

        const sx = scale.x;
        const sy = scale.y;
        const sz = scale.z;

        m[0] *= sx;
        m[1] *= sx;
        m[2] *= sx;
        m[4] *= sy;
        m[5] *= sy;
        m[6] *= sy;
        m[8] *= sz;
        m[9] *= sz;
        m[10] *= sz;

        m[12] = position.x;
        m[13] = position.y;
        m[14] = position.z;

        return this;
    }

    /**
     * Sets this matrix to the perspective projection with reversed depth and the given
     * parameters.
     *
     * @param fieldOfView - The vertical field of view.
     * @param aspectRatio - The ratio of the viewport width to its height.
     * @param nearDistance - The distance to the near clipping plane.
     * @param farDistance - The distance to the far clipping plane.
     *
     * @remarks The field of view is in radians. A zero aspect ratio, a zero field of view, or
     * equal distances leave this matrix unchanged.
     */
    perspective(fieldOfView: number, aspectRatio: number, nearDistance: number, farDistance: number) {
        if (fieldOfView === 0 || aspectRatio === 0 || nearDistance === farDistance) {
            return this;
        }

        const m11 = 1 / Math.tan(fieldOfView / 2);
        const m00 = m11 / aspectRatio;
        const m22 = nearDistance / (farDistance - nearDistance);
        const m23 = farDistance * m22;

        return this.set(
            m00, 0, 0, 0,
            0, m11, 0, 0,
            0, 0, m22, m23,
            0, 0, -1, 0,
        );
    }

    /**
     * Sets this matrix to the elements of the given matrix.
     *
     * @param matrix - The source matrix.
     */
    copy(matrix: Matrix4) {
        this.#elements.set(matrix.elements);

        return this;
    }

    /**
     * Creates a copy of this matrix.
     */
    clone() {
        return new Matrix4().copy(this);
    }

    // Arithmetic -------------------------------------------------------------

    /**
     * Sets this matrix to the product of itself and the given matrix.
     *
     * @param matrix - The right operand.
     */
    multiply(matrix: Matrix4) {
        return this.#multiplyMatrices(this, matrix);
    }

    /**
     * Sets this matrix to the product of the given matrix and itself.
     *
     * @param matrix - The left operand.
     */
    premultiply(matrix: Matrix4) {
        return this.#multiplyMatrices(matrix, this);
    }

    /**
     * Sets this matrix to its transpose.
     */
    transpose() {
        const m = this.#elements;

        return this.set(
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15],
        );
    }

    /**
     * Sets this matrix to its inverse.
     *
     * @remarks A singular matrix is left unchanged.
     */
    invert() {
        const m = this.#elements;

        const m00 = m[0];
        const m01 = m[4];
        const m02 = m[8];
        const m03 = m[12];
        const m10 = m[1];
        const m11 = m[5];
        const m12 = m[9];
        const m13 = m[13];
        const m20 = m[2];
        const m21 = m[6];
        const m22 = m[10];
        const m23 = m[14];
        const m30 = m[3];
        const m31 = m[7];
        const m32 = m[11];
        const m33 = m[15];

        // Inlined from the determinant getter: the inverse reuses c00 to c03.
        const c00 = (
            m11 * (m22 * m33 - m23 * m32) -
            m12 * (m21 * m33 - m23 * m31) +
            m13 * (m21 * m32 - m22 * m31)
        );

        const c01 = -(
            m10 * (m22 * m33 - m23 * m32) -
            m12 * (m20 * m33 - m23 * m30) +
            m13 * (m20 * m32 - m22 * m30)
        );

        const c02 = (
            m10 * (m21 * m33 - m23 * m31) -
            m11 * (m20 * m33 - m23 * m30) +
            m13 * (m20 * m31 - m21 * m30)
        );

        const c03 = -(
            m10 * (m21 * m32 - m22 * m31) -
            m11 * (m20 * m32 - m22 * m30) +
            m12 * (m20 * m31 - m21 * m30)
        );

        const determinant = m00 * c00 + m01 * c01 + m02 * c02 + m03 * c03;

        if (determinant === 0) {
            return this;
        }

        const c10 = -(
            m01 * (m22 * m33 - m23 * m32) -
            m02 * (m21 * m33 - m23 * m31) +
            m03 * (m21 * m32 - m22 * m31)
        );

        const c11 = (
            m00 * (m22 * m33 - m23 * m32) -
            m02 * (m20 * m33 - m23 * m30) +
            m03 * (m20 * m32 - m22 * m30)
        );

        const c12 = -(
            m00 * (m21 * m33 - m23 * m31) -
            m01 * (m20 * m33 - m23 * m30) +
            m03 * (m20 * m31 - m21 * m30)
        );

        const c13 = (
            m00 * (m21 * m32 - m22 * m31) -
            m01 * (m20 * m32 - m22 * m30) +
            m02 * (m20 * m31 - m21 * m30)
        );

        const c20 = (
            m01 * (m12 * m33 - m13 * m32) -
            m02 * (m11 * m33 - m13 * m31) +
            m03 * (m11 * m32 - m12 * m31)
        );

        const c21 = -(
            m00 * (m12 * m33 - m13 * m32) -
            m02 * (m10 * m33 - m13 * m30) +
            m03 * (m10 * m32 - m12 * m30)
        );

        const c22 = (
            m00 * (m11 * m33 - m13 * m31) -
            m01 * (m10 * m33 - m13 * m30) +
            m03 * (m10 * m31 - m11 * m30)
        );

        const c23 = -(
            m00 * (m11 * m32 - m12 * m31) -
            m01 * (m10 * m32 - m12 * m30) +
            m02 * (m10 * m31 - m11 * m30)
        );

        const c30 = -(
            m01 * (m12 * m23 - m13 * m22) -
            m02 * (m11 * m23 - m13 * m21) +
            m03 * (m11 * m22 - m12 * m21)
        );

        const c31 = (
            m00 * (m12 * m23 - m13 * m22) -
            m02 * (m10 * m23 - m13 * m20) +
            m03 * (m10 * m22 - m12 * m20)
        );

        const c32 = -(
            m00 * (m11 * m23 - m13 * m21) -
            m01 * (m10 * m23 - m13 * m20) +
            m03 * (m10 * m21 - m11 * m20)
        );

        const c33 = (
            m00 * (m11 * m22 - m12 * m21) -
            m01 * (m10 * m22 - m12 * m20) +
            m02 * (m10 * m21 - m11 * m20)
        );

        const k = 1 / determinant;

        return this.set(
            k * c00, k * c10, k * c20, k * c30,
            k * c01, k * c11, k * c21, k * c31,
            k * c02, k * c12, k * c22, k * c32,
            k * c03, k * c13, k * c23, k * c33,
        );
    }

    // Comparison -------------------------------------------------------------

    /**
     * Determines whether this matrix equals the given matrix within the given tolerance.
     *
     * @param matrix - The compared matrix.
     * @param tolerance - The maximum absolute difference per element.
     */
    equals(matrix: Matrix4, tolerance = 0) {
        const a = this.#elements;
        const b = matrix.#elements;

        return (
            Math.abs(a[0] - b[0]) <= tolerance &&
            Math.abs(a[1] - b[1]) <= tolerance &&
            Math.abs(a[2] - b[2]) <= tolerance &&
            Math.abs(a[3] - b[3]) <= tolerance &&
            Math.abs(a[4] - b[4]) <= tolerance &&
            Math.abs(a[5] - b[5]) <= tolerance &&
            Math.abs(a[6] - b[6]) <= tolerance &&
            Math.abs(a[7] - b[7]) <= tolerance &&
            Math.abs(a[8] - b[8]) <= tolerance &&
            Math.abs(a[9] - b[9]) <= tolerance &&
            Math.abs(a[10] - b[10]) <= tolerance &&
            Math.abs(a[11] - b[11]) <= tolerance &&
            Math.abs(a[12] - b[12]) <= tolerance &&
            Math.abs(a[13] - b[13]) <= tolerance &&
            Math.abs(a[14] - b[14]) <= tolerance &&
            Math.abs(a[15] - b[15]) <= tolerance
        );
    }

    /**
     * Determines whether this matrix differs from the given matrix beyond the given
     * tolerance.
     *
     * @param matrix - The compared matrix.
     * @param tolerance - The maximum absolute difference per element.
     */
    notEquals(matrix: Matrix4, tolerance = 0) {
        return this.equals(matrix, tolerance) === false;
    }

    // Conversion -------------------------------------------------------------

    /**
     * Writes the elements of this matrix in column-major order into the given array.
     *
     * @param target - The destination array.
     * @param offset - The index of the first element.
     * @returns The given array.
     */
    writeToArray(target: ArrayLike<number>, offset = 0) {
        const m = this.#elements;

        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 0] = m[0];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 1] = m[1];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 2] = m[2];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 3] = m[3];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 4] = m[4];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 5] = m[5];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 6] = m[6];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 7] = m[7];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 8] = m[8];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 9] = m[9];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 10] = m[10];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 11] = m[11];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 12] = m[12];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 13] = m[13];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 14] = m[14];
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 15] = m[15];

        return target;
    }

    // Private ----------------------------------------------------------------

    #multiplyMatrices(matrixA: Matrix4, matrixB: Matrix4) {
        const a = matrixA.#elements;
        const b = matrixB.#elements;

        const a00 = a[0];
        const a01 = a[4];
        const a02 = a[8];
        const a03 = a[12];
        const a10 = a[1];
        const a11 = a[5];
        const a12 = a[9];
        const a13 = a[13];
        const a20 = a[2];
        const a21 = a[6];
        const a22 = a[10];
        const a23 = a[14];
        const a30 = a[3];
        const a31 = a[7];
        const a32 = a[11];
        const a33 = a[15];

        const b00 = b[0];
        const b01 = b[4];
        const b02 = b[8];
        const b03 = b[12];
        const b10 = b[1];
        const b11 = b[5];
        const b12 = b[9];
        const b13 = b[13];
        const b20 = b[2];
        const b21 = b[6];
        const b22 = b[10];
        const b23 = b[14];
        const b30 = b[3];
        const b31 = b[7];
        const b32 = b[11];
        const b33 = b[15];

        return this.set(
            a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30,
            a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31,
            a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32,
            a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33,

            a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30,
            a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31,
            a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32,
            a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33,

            a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30,
            a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31,
            a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32,
            a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33,

            a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30,
            a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31,
            a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32,
            a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33,
        );
    }
}

export { Matrix4 };
