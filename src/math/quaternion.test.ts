import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Quaternion } from './quaternion.ts';
import { Vector3 } from './vector3.ts';

import { assertArrayClose, assertClose } from '../testing/index.ts';

function createRotationAroundY(angle: number) {
    return new Quaternion(0, Math.sin(angle / 2), 0, Math.cos(angle / 2));
}

describe('Quaternion', () => {
    describe('constructor()', () => {
        it('assigns the components', () => {
            const quaternion = new Quaternion(1, -2, 3.5, 4);

            assert.deepEqual(quaternion.writeToArray([]), [1, -2, 3.5, 4]);
        });

        it('creates the identity quaternion by default', () => {
            const quaternion = new Quaternion();

            assert.deepEqual(quaternion.writeToArray([]), [0, 0, 0, 1]);
        });
    });

    describe('lengthSquared', () => {
        it('returns the sum of the squared components', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assertClose(quaternion.lengthSquared, 30);
        });

        it('returns zero for the zero quaternion', () => {
            const quaternion = new Quaternion(0, 0, 0, 0);

            assert.equal(quaternion.lengthSquared, 0);
        });
    });

    describe('length', () => {
        it('returns the norm', () => {
            const quaternion = new Quaternion(1, -1, 1, -1);

            assertClose(quaternion.length, 2);
        });

        it('returns zero for the zero quaternion', () => {
            const quaternion = new Quaternion(0, 0, 0, 0);

            assert.equal(quaternion.length, 0);
        });
    });

    describe('set()', () => {
        it('assigns the components', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.set(-4, 5.5, 0, 0.25);

            assert.deepEqual(quaternion.writeToArray([]), [-4, 5.5, 0, 0.25]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion();

            const result = quaternion.set(1, 2, 3, 4);

            assert.equal(result, quaternion);
        });
    });

    describe('identity()', () => {
        it('sets the identity quaternion', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.identity();

            assert.deepEqual(quaternion.writeToArray([]), [0, 0, 0, 1]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.identity();

            assert.equal(result, quaternion);
        });
    });

    describe('setFromArray()', () => {
        it('reads the components from the start of the array by default', () => {
            const quaternion = new Quaternion();

            quaternion.setFromArray([1, -2, 3.5, 4]);

            assert.deepEqual(quaternion.writeToArray([]), [1, -2, 3.5, 4]);
        });

        it('reads the components starting at the offset', () => {
            const quaternion = new Quaternion();

            quaternion.setFromArray([9, 9, 1, 2, 3, 4, 9], 2);

            assert.deepEqual(quaternion.writeToArray([]), [1, 2, 3, 4]);
        });

        it('reads the components from a typed array', () => {
            const quaternion = new Quaternion();

            quaternion.setFromArray(new Float32Array([1.5, -2, 0.25, 0.5]));

            assert.deepEqual(quaternion.writeToArray([]), [1.5, -2, 0.25, 0.5]);
        });

        it('reads an absent x, y, or z element as zero and an absent w element as one', () => {
            const quaternion = new Quaternion(5, 6, 7, 8);

            quaternion.setFromArray([1]);

            assert.deepEqual(quaternion.writeToArray([]), [1, 0, 0, 1]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion();

            const result = quaternion.setFromArray([1, 2, 3, 4]);

            assert.equal(result, quaternion);
        });
    });

    describe('setFromAxisAngle()', () => {
        it('sets the rotation by a quarter turn around the Y axis', () => {
            const quaternion = new Quaternion();

            quaternion.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);

            assertArrayClose(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('sets the rotation by a half turn around the X axis', () => {
            const quaternion = new Quaternion();

            quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);

            assertArrayClose(quaternion.writeToArray([]), [1, 0, 0, 0]);
        });

        it('sets the identity quaternion for an angle of zero', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.setFromAxisAngle(new Vector3(0, 0, 1), 0);

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 0, 1]);
        });

        it('yields a non-unit quaternion for a non-unit axis', () => {
            const quaternion = new Quaternion();

            quaternion.setFromAxisAngle(new Vector3(0, 2, 0), Math.PI);

            assertArrayClose(quaternion.writeToArray([]), [0, 2, 0, 0]);
        });

        it('leaves the axis unchanged', () => {
            const axis = new Vector3(0, 2, 0);

            new Quaternion().setFromAxisAngle(axis, 1);

            assert.deepEqual(axis.writeToArray([]), [0, 2, 0]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion();

            const result = quaternion.setFromAxisAngle(new Vector3(0, 1, 0), 1);

            assert.equal(result, quaternion);
        });
    });

    describe('copy()', () => {
        it('copies the components of the source', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);
            const source = new Quaternion(-4, 5.5, 0, 0.25);

            quaternion.copy(source);

            assert.deepEqual(quaternion.writeToArray([]), [-4, 5.5, 0, 0.25]);
        });

        it('does not link the quaternion to the source', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);
            const source = new Quaternion(5, 6, 7, 8);

            quaternion.copy(source);
            source.set(9, 10, 11, 12);

            assert.deepEqual(quaternion.writeToArray([]), [5, 6, 7, 8]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion();

            const result = quaternion.copy(new Quaternion(1, 2, 3, 4));

            assert.equal(result, quaternion);
        });
    });

    describe('clone()', () => {
        it('returns a new quaternion with the same components', () => {
            const quaternion = new Quaternion(1, -2, 3.5, 4);

            const clone = quaternion.clone();

            assert.notEqual(clone, quaternion);
            assert.ok(clone instanceof Quaternion);
            assert.deepEqual(clone.writeToArray([]), [1, -2, 3.5, 4]);
        });

        it('returns a quaternion independent of the original', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const clone = quaternion.clone();
            clone.set(5, 6, 7, 8);

            assert.deepEqual(quaternion.writeToArray([]), [1, 2, 3, 4]);
        });
    });

    describe('multiply()', () => {
        it('follows the Hamilton convention for the basis quaternions', () => {
            const basisI = new Quaternion(1, 0, 0, 0);
            const basisJ = new Quaternion(0, 1, 0, 0);
            const basisK = new Quaternion(0, 0, 1, 0);

            assertArrayClose(basisI.clone().multiply(basisJ).writeToArray([]), [0, 0, 1, 0]);
            assertArrayClose(basisJ.clone().multiply(basisK).writeToArray([]), [1, 0, 0, 0]);
            assertArrayClose(basisK.clone().multiply(basisI).writeToArray([]), [0, 1, 0, 0]);
            assertArrayClose(basisI.clone().multiply(basisI).writeToArray([]), [0, 0, 0, -1]);
        });

        it('is not commutative', () => {
            const quaternion = new Quaternion(0, 1, 0, 0);

            quaternion.multiply(new Quaternion(1, 0, 0, 0));

            assertArrayClose(quaternion.writeToArray([]), [0, 0, -1, 0]);
        });

        it('computes the product of general quaternions', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.multiply(new Quaternion(5, 6, 7, 8));

            assertArrayClose(quaternion.writeToArray([]), [24, 48, 48, -6]);
        });

        it('composes rotations so that the operand applies first', () => {
            const rotationX = new Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
            const rotationY = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            rotationY.multiply(rotationX);

            assertArrayClose(rotationY.writeToArray([]), [0.5, 0.5, -0.5, 0.5]);
        });

        it('leaves the quaternion unchanged for the identity operand', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.multiply(new Quaternion(0, 0, 0, 1));

            assertArrayClose(quaternion.writeToArray([]), [1, 2, 3, 4]);
        });

        it('doubles the rotation angle when the operand is the quaternion itself', () => {
            const quaternion = createRotationAroundY(Math.PI / 2);

            quaternion.multiply(quaternion);

            assertArrayClose(quaternion.writeToArray([]), [0, 1, 0, 0]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Quaternion(5, 6, 7, 8);

            new Quaternion(1, 2, 3, 4).multiply(operand);

            assert.deepEqual(operand.writeToArray([]), [5, 6, 7, 8]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.multiply(new Quaternion(5, 6, 7, 8));

            assert.equal(result, quaternion);
        });
    });

    describe('premultiply()', () => {
        it('multiplies in the opposite order', () => {
            const quaternion = new Quaternion(0, 1, 0, 0);

            quaternion.premultiply(new Quaternion(1, 0, 0, 0));

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 1, 0]);
        });

        it('composes rotations so that the operand applies second', () => {
            const rotationX = new Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
            const rotationY = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            rotationX.premultiply(rotationY);

            assertArrayClose(rotationX.writeToArray([]), [0.5, 0.5, -0.5, 0.5]);
        });

        it('doubles the rotation angle when the operand is the quaternion itself', () => {
            const quaternion = createRotationAroundY(Math.PI / 2);

            quaternion.premultiply(quaternion);

            assertArrayClose(quaternion.writeToArray([]), [0, 1, 0, 0]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Quaternion(5, 6, 7, 8);

            new Quaternion(1, 2, 3, 4).premultiply(operand);

            assert.deepEqual(operand.writeToArray([]), [5, 6, 7, 8]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.premultiply(new Quaternion(5, 6, 7, 8));

            assert.equal(result, quaternion);
        });
    });

    describe('scale()', () => {
        it('multiplies every component by the factor', () => {
            const quaternion = new Quaternion(1, -2, 3, 4);

            quaternion.scale(2.5);

            assertArrayClose(quaternion.writeToArray([]), [2.5, -5, 7.5, 10]);
        });

        it('produces the zero quaternion for a factor of zero', () => {
            const quaternion = new Quaternion(1, -2, 3, 4);

            quaternion.scale(0);

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 0, 0]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.scale(2);

            assert.equal(result, quaternion);
        });
    });

    describe('conjugate()', () => {
        it('negates the x, y, and z components', () => {
            const quaternion = new Quaternion(1, -2, 3, 4);

            quaternion.conjugate();

            assert.deepEqual(quaternion.writeToArray([]), [-1, 2, -3, 4]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.conjugate();

            assert.equal(result, quaternion);
        });
    });

    describe('invert()', () => {
        it('sets a unit quaternion to its conjugate', () => {
            const quaternion = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            quaternion.invert();

            assertArrayClose(quaternion.writeToArray([]), [0, -Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('divides the conjugate by the squared norm', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            quaternion.invert();

            assertArrayClose(quaternion.writeToArray([]), [-1 / 30, -2 / 30, -3 / 30, 4 / 30]);
        });

        it('inverts a scalar quaternion', () => {
            const quaternion = new Quaternion(0, 0, 0, 2);

            quaternion.invert();

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 0, 0.5]);
        });

        it('leaves a zero quaternion unchanged', () => {
            const quaternion = new Quaternion(0, 0, 0, 0);

            quaternion.invert();

            assert.deepEqual(quaternion.writeToArray([]), [0, 0, 0, 0]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.invert();

            assert.equal(result, quaternion);
        });
    });

    describe('dot()', () => {
        it('returns the sum of the component products', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.dot(new Quaternion(5, -6, 7, 8));

            assertClose(result, 46);
        });

        it('returns the squared norm when the operand is the quaternion itself', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            const result = quaternion.dot(quaternion);

            assertClose(result, 30);
        });

        it('leaves both quaternions unchanged', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);
            const operand = new Quaternion(5, 6, 7, 8);

            quaternion.dot(operand);

            assert.deepEqual(quaternion.writeToArray([]), [1, 2, 3, 4]);
            assert.deepEqual(operand.writeToArray([]), [5, 6, 7, 8]);
        });
    });

    describe('normalize()', () => {
        it('scales the quaternion to unit norm', () => {
            const quaternion = new Quaternion(0, 0, 3, 4);

            quaternion.normalize();

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 0.6, 0.8]);
        });

        it('preserves the direction', () => {
            const quaternion = new Quaternion(-2, 2, -2, 2);

            quaternion.normalize();

            assertArrayClose(quaternion.writeToArray([]), [-0.5, 0.5, -0.5, 0.5]);
        });

        it('leaves a zero quaternion unchanged', () => {
            const quaternion = new Quaternion(0, 0, 0, 0);

            quaternion.normalize();

            assert.deepEqual(quaternion.writeToArray([]), [0, 0, 0, 0]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion(0, 0, 3, 4);

            const result = quaternion.normalize();

            assert.equal(result, quaternion);
        });
    });

    describe('slerp()', () => {
        it('returns the start at a factor of zero', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(createRotationAroundY(Math.PI / 2), 0);

            assertArrayClose(quaternion.writeToArray([]), [0, 0, 0, 1]);
        });

        it('returns the end at a factor of one', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(createRotationAroundY(Math.PI / 2), 1);

            assertArrayClose(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('interpolates the rotation angle at a constant rate', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(createRotationAroundY(Math.PI / 2), 1 / 3);

            assertArrayClose(
                quaternion.writeToArray([]),
                createRotationAroundY(Math.PI / 6).writeToArray([]),
            );
        });

        it('interpolates between rotations a half turn apart', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(new Quaternion(0, 1, 0, 0), 0.5);

            assertArrayClose(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('follows the shorter arc when the dot product is negative', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(new Quaternion(0, -Math.SQRT1_2, 0, -Math.SQRT1_2), 0.5);

            assertArrayClose(
                quaternion.writeToArray([]),
                createRotationAroundY(Math.PI / 4).writeToArray([]),
            );
        });

        it('keeps unit norm for rotations a small angle apart', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(createRotationAroundY(0.08), 0.5);

            assertArrayClose(
                quaternion.writeToArray([]),
                createRotationAroundY(0.04).writeToArray([]),
            );
        });

        it('interpolates between rotations a tiny angle apart', () => {
            const quaternion = new Quaternion();

            quaternion.slerp(createRotationAroundY(2e-9), 0.5);

            assertArrayClose(
                quaternion.writeToArray([]),
                createRotationAroundY(1e-9).writeToArray([]),
            );
        });

        it('returns the start for identical quaternions with a dot product above one', () => {
            const quaternion = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            quaternion.slerp(new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2), 0.5);

            assertArrayClose(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('returns the start for antipodal quaternions', () => {
            const quaternion = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            quaternion.slerp(new Quaternion(0, -Math.SQRT1_2, 0, -Math.SQRT1_2), 0.5);

            assertArrayClose(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('leaves the end quaternion unchanged', () => {
            const end = new Quaternion(0, -Math.SQRT1_2, 0, -Math.SQRT1_2);

            new Quaternion().slerp(end, 0.5);

            assert.deepEqual(end.writeToArray([]), [0, -Math.SQRT1_2, 0, -Math.SQRT1_2]);
        });

        it('returns this', () => {
            const quaternion = new Quaternion();

            const result = quaternion.slerp(createRotationAroundY(1), 0.5);

            assert.equal(result, quaternion);
        });
    });

    describe('equals()', () => {
        it('returns true for identical components', () => {
            const quaternion = new Quaternion(1, -2, 3.5, 4);

            assert.equal(quaternion.equals(new Quaternion(1, -2, 3.5, 4)), true);
        });

        it('returns false when any component differs', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.equals(new Quaternion(1.5, 2, 3, 4)), false);
            assert.equal(quaternion.equals(new Quaternion(1, 2.5, 3, 4)), false);
            assert.equal(quaternion.equals(new Quaternion(1, 2, 3.5, 4)), false);
            assert.equal(quaternion.equals(new Quaternion(1, 2, 3, 4.5)), false);
        });

        it('uses a tolerance of zero by default', () => {
            const quaternion = new Quaternion(0.1 + 0.2, 0, 0, 1);

            assert.equal(quaternion.equals(new Quaternion(0.3, 0, 0, 1)), false);
        });

        it('returns true when every difference is at most the tolerance', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.equals(new Quaternion(1.5, 1.5, 3.5, 3.5), 0.5), true);
        });

        it('returns false when any difference exceeds the tolerance', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.equals(new Quaternion(1, 2, 3, 4.75), 0.5), false);
        });

        it('returns false for the negation of the quaternion', () => {
            const quaternion = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            const result = quaternion.equals(new Quaternion(0, -Math.SQRT1_2, 0, -Math.SQRT1_2));

            assert.equal(result, false);
        });
    });

    describe('notEquals()', () => {
        it('returns false for identical components', () => {
            const quaternion = new Quaternion(1, -2, 3.5, 4);

            assert.equal(quaternion.notEquals(new Quaternion(1, -2, 3.5, 4)), false);
        });

        it('returns true when any component differs', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.notEquals(new Quaternion(1, 2, 3, 4.5)), true);
        });

        it('returns false when every difference is at most the tolerance', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.notEquals(new Quaternion(1.5, 1.5, 3.5, 3.5), 0.5), false);
        });

        it('returns true when any difference exceeds the tolerance', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);

            assert.equal(quaternion.notEquals(new Quaternion(1, 2, 3, 4.75), 0.5), true);
        });
    });

    describe('writeToArray()', () => {
        it('writes the components to the start of the array by default', () => {
            const quaternion = new Quaternion(1, -2, 3.5, 4);

            const target = quaternion.writeToArray([]);

            assert.deepEqual(target, [1, -2, 3.5, 4]);
        });

        it('writes the components starting at the offset', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);
            const target = [9, 9, 9, 9, 9, 9];

            quaternion.writeToArray(target, 1);

            assert.deepEqual(target, [9, 1, 2, 3, 4, 9]);
        });

        it('writes the components into a typed array', () => {
            const quaternion = new Quaternion(1.5, -2, 0.25, 0.5);
            const target = new Float32Array(4);

            quaternion.writeToArray(target);

            assert.deepEqual(Array.from(target), [1.5, -2, 0.25, 0.5]);
        });

        it('returns the given array', () => {
            const quaternion = new Quaternion(1, 2, 3, 4);
            const target = [0, 0, 0, 0];

            const result = quaternion.writeToArray(target);

            assert.equal(result, target);
        });
    });
});
