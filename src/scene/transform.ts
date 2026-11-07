import { Vector3, Quaternion, Matrix4 } from '../math/index.ts';

/**
 * The position, rotation, and scale of a scene node relative to its parent.
 */
class Transform {
    #position: Vector3;
    #rotation: Quaternion;
    #scale: Vector3;
    #localMatrix: Matrix4;
    #localMatrixVersion: number;

    #snapshotPosition: Vector3;
    #snapshotRotation: Quaternion;
    #snapshotScale: Vector3;

    /**
     * Creates a transform with zero position, no rotation, and a scale of one.
     */
    constructor() {
        this.#position = new Vector3();
        this.#rotation = new Quaternion();
        this.#scale = new Vector3(1, 1, 1);
        this.#localMatrix = new Matrix4();
        this.#localMatrixVersion = 0;

        this.#snapshotPosition = this.#position.clone();
        this.#snapshotRotation = this.#rotation.clone();
        this.#snapshotScale = this.#scale.clone();
    }

    /**
     * The position relative to the parent node, in meters.
     *
     * @remarks Changes take effect at the next update of the scene.
     */
    get position() {
        return this.#position;
    }

    /**
     * The rotation relative to the parent node.
     *
     * @remarks Changes take effect at the next update of the scene.
     */
    get rotation() {
        return this.#rotation;
    }

    /**
     * The scale factors along the X, Y, and Z axes relative to the parent node.
     *
     * @remarks Changes take effect at the next update of the scene.
     */
    get scale() {
        return this.#scale;
    }

    /**
     * The number of times the local matrix has changed.
     */
    get localMatrixVersion() {
        return this.#localMatrixVersion;
    }

    /**
     * Applies the current position, rotation, and scale to the local matrix of this transform.
     */
    updateLocalMatrix() {
        const positionHasChanged = this.#position.notEquals(this.#snapshotPosition);
        const rotationHasChanged = this.#rotation.notEquals(this.#snapshotRotation);
        const scaleHasChanged = this.#scale.notEquals(this.#snapshotScale);

        if (positionHasChanged || rotationHasChanged || scaleHasChanged) {
            this.#localMatrix.compose(this.#position, this.#rotation, this.#scale);
            this.#localMatrixVersion++;

            this.#snapshotPosition.copy(this.#position);
            this.#snapshotRotation.copy(this.#rotation);
            this.#snapshotScale.copy(this.#scale);
        }
    }

    /**
     * Copies the local matrix of this transform into the given matrix.
     *
     * @param target - The destination matrix.
     *
     * @returns The given matrix.
     *
     * @remarks The copy does not include changes made after the last local matrix update.
     */
    copyLocalMatrixTo(target: Matrix4) {
        return target.copy(this.#localMatrix);
    }
}

export { Transform };
