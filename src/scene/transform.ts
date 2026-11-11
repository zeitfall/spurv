import { Vector3, Quaternion, Matrix4 } from '../math/index.ts';

/**
 * A placement of a scene node relative to its parent, composed of a position, a rotation, and a scale.
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
     * Creates a transform that places its node at the origin of the parent, without rotation or scaling.
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
     * The position relative to the parent node.
     *
     * @remarks The position is in meters. Changes take effect at the next update of the world matrix.
     */
    get position() {
        return this.#position;
    }

    /**
     * The rotation relative to the parent node.
     *
     * @remarks Changes take effect at the next update of the world matrix.
     */
    get rotation() {
        return this.#rotation;
    }

    /**
     * The scale factors along the X, Y, and Z axes relative to the parent node.
     *
     * @remarks Changes take effect at the next update of the world matrix.
     */
    get scale() {
        return this.#scale;
    }

    /**
     * The counter that increases each time the local matrix of this transform changes.
     *
     * @remarks Two readings that differ indicate a change, so the matrices need not be compared.
     */
    get localMatrixVersion() {
        return this.#localMatrixVersion;
    }

    /**
     * Updates the local matrix of this transform from its position, rotation, and scale.
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
     * @param matrix - The destination matrix.
     *
     * @returns The given matrix.
     *
     * @remarks The local matrix is recomputed only by an update, so changes to the position, rotation,
     * or scale made since the last update are not reflected.
     */
    copyLocalMatrixTo(matrix: Matrix4) {
        return matrix.copy(this.#localMatrix);
    }
}

export { Transform };
