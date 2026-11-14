import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    Vector3,
    Quaternion,
    Matrix4,
} from '../math/index.ts';

import { Transform } from './transform.ts';

import { assertArrayClose } from '../testing/index.ts';

function createGeneralMatrix() {
    return new Matrix4().set(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
    );
}

function readLocalMatrix(transform: Transform) {
    return transform.copyLocalMatrixTo(createGeneralMatrix()).writeToArray([]);
}

describe('Transform', () => {
    describe('constructor()', () => {
        it('creates the zero position, the identity rotation, and the unit scale', () => {
            const transform = new Transform();

            assert.deepEqual(transform.position.writeToArray([]), [0, 0, 0]);
            assert.deepEqual(transform.rotation.writeToArray([]), [0, 0, 0, 1]);
            assert.deepEqual(transform.scale.writeToArray([]), [1, 1, 1]);
        });

        it('creates the identity local matrix', () => {
            const transform = new Transform();

            assert.deepEqual(readLocalMatrix(transform), new Matrix4().writeToArray([]));
        });

        it('starts the local matrix version at zero', () => {
            const transform = new Transform();

            assert.equal(transform.localMatrixVersion, 0);
        });
    });

    describe('position', () => {
        it('returns the same instance on every read', () => {
            const transform = new Transform();

            assert.equal(transform.position, transform.position);
        });

        it('throws on assignment', () => {
            const transform = new Transform();

            assert.throws(() => Object.assign(transform, { position: new Vector3() }), TypeError);
        });
    });

    describe('rotation', () => {
        it('returns the same instance on every read', () => {
            const transform = new Transform();

            assert.equal(transform.rotation, transform.rotation);
        });

        it('throws on assignment', () => {
            const transform = new Transform();

            assert.throws(() => Object.assign(transform, { rotation: new Quaternion() }), TypeError);
        });
    });

    describe('scale', () => {
        it('returns the same instance on every read', () => {
            const transform = new Transform();

            assert.equal(transform.scale, transform.scale);
        });

        it('throws on assignment', () => {
            const transform = new Transform();

            assert.throws(() => Object.assign(transform, { scale: new Vector3() }), TypeError);
        });
    });

    describe('localMatrixVersion', () => {
        it('throws on assignment', () => {
            const transform = new Transform();

            assert.throws(() => Object.assign(transform, { localMatrixVersion: 5 }), TypeError);
        });
    });

    describe('updateLocalMatrix()', () => {
        it('composes the local matrix from the scale, the rotation, and the position', () => {
            const transform = new Transform();

            transform.position.set(5, 6, 7);
            transform.rotation.set(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            transform.scale.set(2, 3, 4);
            transform.updateLocalMatrix();

            const expectedMatrix = new Matrix4().set(
                0, -3, 0, 5,
                2, 0, 0, 6,
                0, 0, 4, 7,
                0, 0, 0, 1,
            );

            assertArrayClose(readLocalMatrix(transform), expectedMatrix.writeToArray([]));
        });

        it('increments the local matrix version when the position changed', () => {
            const transform = new Transform();

            transform.position.x = 1;
            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 1);
        });

        it('increments the local matrix version when the rotation changed', () => {
            const transform = new Transform();

            transform.rotation.set(0, Math.SQRT1_2, 0, Math.SQRT1_2);
            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 1);
        });

        it('increments the local matrix version when the scale changed', () => {
            const transform = new Transform();

            transform.scale.z = 2;
            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 1);
        });

        it('increments the local matrix version once for several changes before one update', () => {
            const transform = new Transform();

            transform.position.set(1, 2, 3);
            transform.scale.set(2, 2, 2);
            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 1);
        });

        it('keeps the local matrix version and the local matrix when nothing changed', () => {
            const transform = new Transform();

            transform.position.set(1, 2, 3);
            transform.updateLocalMatrix();

            const localMatrix = readLocalMatrix(transform);

            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 1);
            assert.deepEqual(readLocalMatrix(transform), localMatrix);
        });

        it('keeps the local matrix version when a value returns to its previous value before the update', () => {
            const transform = new Transform();

            transform.position.x = 4;
            transform.position.x = 0;
            transform.updateLocalMatrix();

            assert.equal(transform.localMatrixVersion, 0);
        });

        it('detects a change made after the previous update', () => {
            const transform = new Transform();

            transform.position.x = 1;
            transform.updateLocalMatrix();
            transform.position.x = 2;
            transform.updateLocalMatrix();

            const expectedMatrix = new Matrix4().set(
                1, 0, 0, 2,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            );

            assert.equal(transform.localMatrixVersion, 2);
            assertArrayClose(readLocalMatrix(transform), expectedMatrix.writeToArray([]));
        });
    });

    describe('copyLocalMatrixTo()', () => {
        it('returns the given matrix', () => {
            const transform = new Transform();
            const target = new Matrix4();

            assert.equal(transform.copyLocalMatrixTo(target), target);
        });

        it('reflects the last update, not later changes', () => {
            const transform = new Transform();

            transform.position.x = 1;

            assert.deepEqual(readLocalMatrix(transform), new Matrix4().writeToArray([]));
        });

        it('returns a copy that is independent of the transform', () => {
            const transform = new Transform();
            const target = transform.copyLocalMatrixTo(new Matrix4());

            target.copy(createGeneralMatrix());

            assert.deepEqual(readLocalMatrix(transform), new Matrix4().writeToArray([]));
        });
    });
});
