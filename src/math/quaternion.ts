import { clamp } from './scalar.ts';

import type { Vector3 } from './vector3.ts';

/**
 * A unit quaternion representing a rotation in three-dimensional space.
 *
 * Methods modify this quaternion and return it unless stated otherwise.
 */
class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;

    /**
     * Creates a quaternion with the given components.
     *
     * @param x - The x component.
     * @param y - The y component.
     * @param z - The z component.
     * @param w - The w component.
     */
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * Computes the squared norm of this quaternion.
     */
    get lengthSquared() {
        return this.dot(this);
    }

    /**
     * Computes the norm of this quaternion.
     */
    get length() {
        return Math.sqrt(this.lengthSquared);
    }

    // Assignment -------------------------------------------------------------

    /**
     * Sets this quaternion to the given components.
     *
     * @param x - The x component.
     * @param y - The y component.
     * @param z - The z component.
     * @param w - The w component.
     */
    set(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;
    }

    /**
     * Sets this quaternion to the identity quaternion.
     */
    identity() {
        return this.set(0, 0, 0, 1);
    }

    /**
     * Sets this quaternion to the components read from the given array.
     *
     * @param array - The source array.
     * @param offset - The index of the x component.
     *
     * @remarks An absent x, y, or z element is read as zero, and an absent w as one.
     */
    setFromArray(array: ArrayLike<number>, offset = 0) {
        return this.set(
            array[offset + 0] ?? 0,
            array[offset + 1] ?? 0,
            array[offset + 2] ?? 0,
            array[offset + 3] ?? 1,
        );
    }

    /**
     * Sets this quaternion to the rotation by the given angle around the given axis.
     *
     * @param axis - The rotation axis.
     * @param angle - The rotation angle.
     *
     * @remarks The angle is in radians. A non-unit axis yields a non-unit quaternion.
     */
    setFromAxisAngle(axis: Vector3, angle: number) {
        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);
        const cosHalfAngle = Math.cos(halfAngle);

        return this.set(
            sinHalfAngle * axis.x,
            sinHalfAngle * axis.y,
            sinHalfAngle * axis.z,
            cosHalfAngle,
        );
    }

    /**
     * Sets this quaternion to the components of the given quaternion.
     *
     * @param quaternion - The source quaternion.
     */
    copy(quaternion: Quaternion) {
        return this.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }

    /**
     * Creates a copy of this quaternion.
     */
    clone() {
        return new Quaternion(this.x, this.y, this.z, this.w);
    }

    // Arithmetic -------------------------------------------------------------

    /**
     * Sets this quaternion to the product of itself and the given quaternion.
     *
     * @param quaternion - The right operand.
     */
    multiply(quaternion: Quaternion) {
        return this.#multiplyQuaternions(this, quaternion);
    }

    /**
     * Sets this quaternion to the product of the given quaternion and itself.
     *
     * @param quaternion - The left operand.
     */
    premultiply(quaternion: Quaternion) {
        return this.#multiplyQuaternions(quaternion, this);
    }

    /**
     * Sets this quaternion to the product of itself and the given scalar.
     *
     * @param factor - The scalar multiplier.
     */
    scale(factor: number) {
        return this.set(
            factor * this.x,
            factor * this.y,
            factor * this.z,
            factor * this.w,
        );
    }

    /**
     * Sets this quaternion to its conjugate.
     */
    conjugate() {
        return this.set(-this.x, -this.y, -this.z, this.w);
    }

    /**
     * Sets this quaternion to its multiplicative inverse.
     *
     * @remarks A zero quaternion is left unchanged.
     */
    invert() {
        const lengthSquared = this.lengthSquared;

        if (lengthSquared === 0) {
            return this;
        }

        return this.conjugate().scale(1 / lengthSquared);
    }

    // Geometry ---------------------------------------------------------------

    /**
     * Computes the dot product of this quaternion and the given quaternion.
     *
     * @param quaternion - The right operand.
     */
    dot(quaternion: Quaternion) {
        return (
            this.x * quaternion.x +
            this.y * quaternion.y +
            this.z * quaternion.z +
            this.w * quaternion.w
        );
    }

    /**
     * Sets this quaternion to the unit quaternion with the same direction.
     *
     * @remarks A zero quaternion is left unchanged.
     */
    normalize() {
        const length = this.length;

        if (length === 0) {
            return this;
        }

        return this.scale(1 / length);
    }

    // Interpolation ----------------------------------------------------------

    /**
     * Sets this quaternion to the spherical linear interpolation between itself and the
     * given quaternion.
     *
     * @param quaternion - The end quaternion.
     * @param factor - The interpolation factor.
     *
     * @remarks The interpolation follows the shorter arc.
     */
    slerp(quaternion: Quaternion, factor: number) {
        const dotProduct = this.dot(quaternion);

        let cosHalfAngle = clamp(dotProduct, -1, 1);

        if (dotProduct < 0) {
            cosHalfAngle = -cosHalfAngle;
        }

        let k0;
        let k1;

        const sinHalfAngle = Math.sqrt(1 - cosHalfAngle * cosHalfAngle);

        if (sinHalfAngle === 0) {
            k0 = 1 - factor;
            k1 = factor;
        }
        else {
            const halfAngle = Math.atan2(sinHalfAngle, cosHalfAngle);

            k0 = Math.sin((1 - factor) * halfAngle) / sinHalfAngle;
            k1 = Math.sin(factor * halfAngle) / sinHalfAngle;
        }

        if (dotProduct < 0) {
            k1 = -k1;
        }

        return this.set(
            k0 * this.x + k1 * quaternion.x,
            k0 * this.y + k1 * quaternion.y,
            k0 * this.z + k1 * quaternion.z,
            k0 * this.w + k1 * quaternion.w,
        );
    }

    // Comparison -------------------------------------------------------------

    /**
     * Determines whether this quaternion equals the given quaternion within the given
     * tolerance.
     *
     * @param quaternion - The compared quaternion.
     * @param tolerance - The maximum absolute difference per component.
     */
    equals(quaternion: Quaternion, tolerance = 0) {
        return (
            Math.abs(this.x - quaternion.x) <= tolerance &&
            Math.abs(this.y - quaternion.y) <= tolerance &&
            Math.abs(this.z - quaternion.z) <= tolerance &&
            Math.abs(this.w - quaternion.w) <= tolerance
        );
    }

    /**
     * Determines whether this quaternion differs from the given quaternion beyond the given
     * tolerance.
     *
     * @param quaternion - The compared quaternion.
     * @param tolerance - The maximum absolute difference per component.
     */
    notEquals(quaternion: Quaternion, tolerance = 0) {
        return this.equals(quaternion, tolerance) === false;
    }

    // Conversion -------------------------------------------------------------

    /**
     * Writes the components of this quaternion into the given array.
     *
     * @param target - The destination array.
     * @param offset - The index of the x component.
     * @returns The given array.
     */
    writeToArray(target: ArrayLike<number>, offset = 0) {
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 0] = this.x;
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 1] = this.y;
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 2] = this.z;
        // @ts-expect-error TS2542: ArrayLike<number> is read-only.
        target[offset + 3] = this.w;

        return target;
    }

    // Private ----------------------------------------------------------------

    #multiplyQuaternions(quaternionA: Quaternion, quaternionB: Quaternion) {
        const ax = quaternionA.x;
        const ay = quaternionA.y;
        const az = quaternionA.z;
        const aw = quaternionA.w;

        const bx = quaternionB.x;
        const by = quaternionB.y;
        const bz = quaternionB.z;
        const bw = quaternionB.w;

        return this.set(
            aw * bx + ax * bw + ay * bz - az * by,
            aw * by + ay * bw + az * bx - ax * bz,
            aw * bz + az * bw + ax * by - ay * bx,
            aw * bw - ax * bx - ay * by - az * bz,
        );
    }
}

export { Quaternion };
