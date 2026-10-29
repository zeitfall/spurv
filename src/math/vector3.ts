import { lerp } from './scalar.ts';

/**
 * A vector in three-dimensional space.
 *
 * Methods modify this vector and return it unless stated otherwise.
 */
class Vector3 {
    x: number;
    y: number;
    z: number;

    /**
     * Creates a vector with the given components.
     *
     * @param x - The x component.
     * @param y - The y component.
     * @param z - The z component.
     */
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * Computes the squared Euclidean length of this vector.
     */
    get lengthSquared() {
        return this.dot(this);
    }

    /**
     * Computes the Euclidean length of this vector.
     */
    get length() {
        return Math.sqrt(this.lengthSquared);
    }

    // Assignment -------------------------------------------------------------

    /**
     * Sets this vector to the given components.
     *
     * @param x - The x component.
     * @param y - The y component.
     * @param z - The z component.
     */
    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    /**
     * Sets this vector to the components read from the given array.
     *
     * @param array - The source array.
     * @param offset - The index of the x component.
     * @remarks An element absent from the array is read as zero.
     */
    setFromArray(array: ArrayLike<number>, offset = 0) {
        return this.set(
            array[offset + 0] ?? 0,
            array[offset + 1] ?? 0,
            array[offset + 2] ?? 0,
        );
    }

    /**
     * Sets this vector to the components of the given vector.
     *
     * @param vector - The source vector.
     */
    copy(vector: Vector3) {
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;

        return this;
    }

    /**
     * Creates a copy of this vector.
     */
    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    // Arithmetic -------------------------------------------------------------

    /**
     * Sets this vector to the sum of itself and the given vector.
     *
     * @param vector - The addend.
     */
    add(vector: Vector3) {
        return this.set(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    /**
     * Sets this vector to the difference of itself and the given vector.
     *
     * @param vector - The subtrahend.
     */
    subtract(vector: Vector3) {
        return this.set(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    /**
     * Sets this vector to the component-wise product of itself and the given vector.
     *
     * @param vector - The multiplier.
     */
    multiply(vector: Vector3) {
        return this.set(this.x * vector.x, this.y * vector.y, this.z * vector.z);
    }

    /**
     * Sets this vector to the product of itself and the given scalar.
     *
     * @param factor - The scalar multiplier.
     */
    scale(factor: number) {
        return this.set(this.x * factor, this.y * factor, this.z * factor);
    }

    /**
     * Sets this vector to its additive inverse.
     */
    negate() {
        return this.scale(-1);
    }

    // Geometry ---------------------------------------------------------------

    /**
     * Computes the dot product of this vector and the given vector.
     *
     * @param vector - The right operand.
     */
    dot(vector: Vector3) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    }

    /**
     * Sets this vector to the cross product of itself and the given vector.
     *
     * @param vector - The right operand.
     */
    cross(vector: Vector3) {
        return this.set(
            this.y * vector.z - this.z * vector.y,
            this.z * vector.x - this.x * vector.z,
            this.x * vector.y - this.y * vector.x,
        );
    }

    /**
     * Computes the Euclidean distance between this vector and the given vector.
     *
     * @param vector - The other point.
     */
    distance(vector: Vector3) {
        const deltaX = this.x - vector.x;
        const deltaY = this.y - vector.y;
        const deltaZ = this.z - vector.z;

        return Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    }

    /**
     * Sets this vector to the unit vector with the same direction.
     *
     * @remarks A zero vector is left unchanged.
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
     * Sets this vector to the linear interpolation between itself and the given vector.
     *
     * @param vector - The end vector.
     * @param factor - The interpolation factor.
     */
    lerp(vector: Vector3, factor: number) {
        return this.set(
            lerp(this.x, vector.x, factor),
            lerp(this.y, vector.y, factor),
            lerp(this.z, vector.z, factor),
        );
    }

    // Comparison -------------------------------------------------------------

    /**
     * Determines whether this vector equals the given vector within the given tolerance.
     *
     * @param vector - The compared vector.
     * @param tolerance - The maximum absolute difference per component.
     */
    equals(vector: Vector3, tolerance = 0) {
        return Math.abs(this.x - vector.x) <= tolerance &&
            Math.abs(this.y - vector.y) <= tolerance &&
            Math.abs(this.z - vector.z) <= tolerance;
    }

    /**
     * Determines whether this vector differs from the given vector beyond the given tolerance.
     *
     * @param vector - The compared vector.
     * @param tolerance - The maximum absolute difference per component.
     */
    notEquals(vector: Vector3, tolerance = 0) {
        return this.equals(vector, tolerance) === false;
    }

    // Conversion -------------------------------------------------------------

    /**
     * Writes the components of this vector into the given array.
     *
     * @param target - The destination array.
     * @param offset - The index of the x component.
     * @returns The given array.
     */
    writeToArray(target: ArrayLike<number>, offset = 0) {
        // @ts-expect-error TS2542: Index signature in type 'ArrayLike<number>' only permits reading.
        target[offset + 0] = this.x;
        // @ts-expect-error TS2542: Index signature in type 'ArrayLike<number>' only permits reading.
        target[offset + 1] = this.y;
        // @ts-expect-error TS2542: Index signature in type 'ArrayLike<number>' only permits reading.
        target[offset + 2] = this.z;

        return target;
    }
}

export { Vector3 };
