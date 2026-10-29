import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Vector3 } from './vector3.ts';

import { assertArrayClose, assertClose } from '../testing/index.ts';

describe('Vector3', () => {
    describe('constructor()', () => {
        it('assigns the components', () => {
            const vector = new Vector3(1, -2, 3.5);

            assert.deepEqual(vector.writeToArray([]), [1, -2, 3.5]);
        });

        it('creates the zero vector by default', () => {
            const vector = new Vector3();

            assert.deepEqual(vector.writeToArray([]), [0, 0, 0]);
        });
    });

    describe('lengthSquared', () => {
        it('returns the sum of the squared components', () => {
            const vector = new Vector3(3, -4, 12);

            assertClose(vector.lengthSquared, 169);
        });

        it('returns zero for the zero vector', () => {
            const vector = new Vector3(0, 0, 0);

            assert.equal(vector.lengthSquared, 0);
        });
    });

    describe('length', () => {
        it('returns the Euclidean length', () => {
            const vector = new Vector3(3, -4, 12);

            assertClose(vector.length, 13);
        });

        it('returns zero for the zero vector', () => {
            const vector = new Vector3(0, 0, 0);

            assert.equal(vector.length, 0);
        });
    });

    describe('set()', () => {
        it('assigns the components', () => {
            const vector = new Vector3(1, 2, 3);

            vector.set(-4, 5.5, 0);

            assert.deepEqual(vector.writeToArray([]), [-4, 5.5, 0]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.set(4, 5, 6);

            assert.equal(result, vector);
        });
    });

    describe('setFromArray()', () => {
        it('reads the components from the start of the array by default', () => {
            const vector = new Vector3(0, 0, 0);

            vector.setFromArray([1, -2, 3.5]);

            assert.deepEqual(vector.writeToArray([]), [1, -2, 3.5]);
        });

        it('reads the components starting at the offset', () => {
            const vector = new Vector3(0, 0, 0);

            vector.setFromArray([9, 9, 1, 2, 3, 9], 2);

            assert.deepEqual(vector.writeToArray([]), [1, 2, 3]);
        });

        it('reads the components from a typed array', () => {
            const vector = new Vector3(0, 0, 0);

            vector.setFromArray(new Float32Array([1.5, -2, 0.25]));

            assert.deepEqual(vector.writeToArray([]), [1.5, -2, 0.25]);
        });

        it('reads an element absent from the array as zero', () => {
            const vector = new Vector3(4, 5, 6);

            vector.setFromArray([1]);

            assert.deepEqual(vector.writeToArray([]), [1, 0, 0]);
        });

        it('returns this', () => {
            const vector = new Vector3(0, 0, 0);

            const result = vector.setFromArray([1, 2, 3]);

            assert.equal(result, vector);
        });
    });

    describe('copy()', () => {
        it('copies the components of the source', () => {
            const vector = new Vector3(1, 2, 3);
            const source = new Vector3(-4, 5.5, 0);

            vector.copy(source);

            assert.deepEqual(vector.writeToArray([]), [-4, 5.5, 0]);
        });

        it('does not link the vector to the source', () => {
            const vector = new Vector3(1, 2, 3);
            const source = new Vector3(4, 5, 6);

            vector.copy(source);
            source.set(7, 8, 9);

            assert.deepEqual(vector.writeToArray([]), [4, 5, 6]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.copy(new Vector3(4, 5, 6));

            assert.equal(result, vector);
        });
    });

    describe('clone()', () => {
        it('returns a new vector with the same components', () => {
            const vector = new Vector3(1, -2, 3.5);

            const clone = vector.clone();

            assert.notEqual(clone, vector);
            assert.ok(clone instanceof Vector3);
            assert.deepEqual(clone.writeToArray([]), [1, -2, 3.5]);
        });

        it('returns a vector independent of the original', () => {
            const vector = new Vector3(1, 2, 3);

            const clone = vector.clone();
            clone.set(4, 5, 6);

            assert.deepEqual(vector.writeToArray([]), [1, 2, 3]);
        });
    });

    describe('add()', () => {
        it('adds the vector component-wise', () => {
            const vector = new Vector3(1, 2, 3);

            vector.add(new Vector3(4, -6, 0.5));

            assertArrayClose(vector.writeToArray([]), [5, -4, 3.5]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Vector3(4, 5, 6);

            new Vector3(1, 2, 3).add(operand);

            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });

        it('doubles the vector when the operand is the vector itself', () => {
            const vector = new Vector3(1, -2, 3);

            vector.add(vector);

            assertArrayClose(vector.writeToArray([]), [2, -4, 6]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.add(new Vector3(4, 5, 6));

            assert.equal(result, vector);
        });
    });

    describe('subtract()', () => {
        it('subtracts the vector component-wise', () => {
            const vector = new Vector3(1, 2, 3);

            vector.subtract(new Vector3(4, -6, 0.5));

            assertArrayClose(vector.writeToArray([]), [-3, 8, 2.5]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Vector3(4, 5, 6);

            new Vector3(1, 2, 3).subtract(operand);

            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });

        it('produces the zero vector when the operand is the vector itself', () => {
            const vector = new Vector3(1, -2, 3);

            vector.subtract(vector);

            assertArrayClose(vector.writeToArray([]), [0, 0, 0]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.subtract(new Vector3(4, 5, 6));

            assert.equal(result, vector);
        });
    });

    describe('multiply()', () => {
        it('multiplies the vector component-wise', () => {
            const vector = new Vector3(1, 2, 3);

            vector.multiply(new Vector3(4, -6, 0.5));

            assertArrayClose(vector.writeToArray([]), [4, -12, 1.5]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Vector3(4, 5, 6);

            new Vector3(1, 2, 3).multiply(operand);

            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });

        it('squares the components when the operand is the vector itself', () => {
            const vector = new Vector3(1, -2, 3);

            vector.multiply(vector);

            assertArrayClose(vector.writeToArray([]), [1, 4, 9]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.multiply(new Vector3(4, 5, 6));

            assert.equal(result, vector);
        });
    });

    describe('scale()', () => {
        it('multiplies every component by the factor', () => {
            const vector = new Vector3(1, -2, 3);

            vector.scale(2.5);

            assertArrayClose(vector.writeToArray([]), [2.5, -5, 7.5]);
        });

        it('produces the zero vector for a factor of zero', () => {
            const vector = new Vector3(1, -2, 3);

            vector.scale(0);

            assertArrayClose(vector.writeToArray([]), [0, 0, 0]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.scale(2);

            assert.equal(result, vector);
        });
    });

    describe('negate()', () => {
        it('negates every component', () => {
            const vector = new Vector3(1, -2, 3);

            vector.negate();

            assertArrayClose(vector.writeToArray([]), [-1, 2, -3]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.negate();

            assert.equal(result, vector);
        });
    });

    describe('dot()', () => {
        it('returns the sum of the component products', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.dot(new Vector3(4, -5, 6));

            assertClose(result, 12);
        });

        it('returns zero for perpendicular vectors', () => {
            const vector = new Vector3(1, 0, 0);

            const result = vector.dot(new Vector3(0, 1, 0));

            assertClose(result, 0);
        });

        it('returns the squared length when the operand is the vector itself', () => {
            const vector = new Vector3(3, -4, 12);

            const result = vector.dot(vector);

            assertClose(result, 169);
        });

        it('leaves both vectors unchanged', () => {
            const vector = new Vector3(1, 2, 3);
            const operand = new Vector3(4, 5, 6);

            vector.dot(operand);

            assert.deepEqual(vector.writeToArray([]), [1, 2, 3]);
            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });
    });

    describe('cross()', () => {
        it('computes the cross product', () => {
            const vector = new Vector3(1, 2, 3);

            vector.cross(new Vector3(4, 5, 6));

            assertArrayClose(vector.writeToArray([]), [-3, 6, -3]);
        });

        it('follows the right-hand rule', () => {
            const x = new Vector3(1, 0, 0);
            const y = new Vector3(0, 1, 0);
            const z = new Vector3(0, 0, 1);

            assertArrayClose(x.clone().cross(y).writeToArray([]), [0, 0, 1]);
            assertArrayClose(y.clone().cross(z).writeToArray([]), [1, 0, 0]);
            assertArrayClose(z.clone().cross(x).writeToArray([]), [0, 1, 0]);
        });

        it('is anticommutative', () => {
            const vector = new Vector3(4, 5, 6);

            vector.cross(new Vector3(1, 2, 3));

            assertArrayClose(vector.writeToArray([]), [3, -6, 3]);
        });

        it('produces the zero vector for parallel vectors', () => {
            const vector = new Vector3(1, -2, 3);

            vector.cross(new Vector3(-2, 4, -6));

            assertArrayClose(vector.writeToArray([]), [0, 0, 0]);
        });

        it('produces the zero vector when the operand is the vector itself', () => {
            const vector = new Vector3(1, -2, 3);

            vector.cross(vector);

            assertArrayClose(vector.writeToArray([]), [0, 0, 0]);
        });

        it('leaves the operand unchanged', () => {
            const operand = new Vector3(4, 5, 6);

            new Vector3(1, 2, 3).cross(operand);

            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.cross(new Vector3(4, 5, 6));

            assert.equal(result, vector);
        });
    });

    describe('distance()', () => {
        it('returns the Euclidean distance between the points', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.distance(new Vector3(4, -2, 15));

            assertClose(result, 13);
        });

        it('is symmetric', () => {
            const vector = new Vector3(4, -2, 15);

            const result = vector.distance(new Vector3(1, 2, 3));

            assertClose(result, 13);
        });

        it('returns zero for coincident points', () => {
            const vector = new Vector3(1, -2, 3);

            const result = vector.distance(new Vector3(1, -2, 3));

            assert.equal(result, 0);
        });

        it('leaves both vectors unchanged', () => {
            const vector = new Vector3(1, 2, 3);
            const operand = new Vector3(4, 5, 6);

            vector.distance(operand);

            assert.deepEqual(vector.writeToArray([]), [1, 2, 3]);
            assert.deepEqual(operand.writeToArray([]), [4, 5, 6]);
        });
    });

    describe('normalize()', () => {
        it('scales the vector to unit length', () => {
            const vector = new Vector3(3, 0, 4);

            vector.normalize();

            assertArrayClose(vector.writeToArray([]), [0.6, 0, 0.8]);
        });

        it('preserves the direction', () => {
            const vector = new Vector3(-2, 4, 4);

            vector.normalize();

            assertArrayClose(vector.writeToArray([]), [-1 / 3, 2 / 3, 2 / 3]);
        });

        it('leaves a zero vector unchanged', () => {
            const vector = new Vector3(0, 0, 0);

            vector.normalize();

            assert.deepEqual(vector.writeToArray([]), [0, 0, 0]);
        });

        it('returns this', () => {
            const vector = new Vector3(3, 0, 4);

            const result = vector.normalize();

            assert.equal(result, vector);
        });
    });

    describe('lerp()', () => {
        it('interpolates linearly between the vectors', () => {
            const vector = new Vector3(0, 10, -4);

            vector.lerp(new Vector3(10, 20, 4), 0.25);

            assertArrayClose(vector.writeToArray([]), [2.5, 12.5, -2]);
        });

        it('returns the start exactly at a factor of zero', () => {
            const vector = new Vector3(1e16, 0.1, -1e-16);

            vector.lerp(new Vector3(0.1, 1e-8, 0.3), 0);

            assert.deepEqual(vector.writeToArray([]), [1e16, 0.1, -1e-16]);
        });

        it('returns the target exactly at a factor of one', () => {
            const vector = new Vector3(1e16, 0.1, 0.3);

            vector.lerp(new Vector3(0.1, 1e-8, -1e-16), 1);

            assert.deepEqual(vector.writeToArray([]), [0.1, 1e-8, -1e-16]);
        });

        it('leaves the target unchanged', () => {
            const target = new Vector3(4, 5, 6);

            new Vector3(1, 2, 3).lerp(target, 0.5);

            assert.deepEqual(target.writeToArray([]), [4, 5, 6]);
        });

        it('returns this', () => {
            const vector = new Vector3(1, 2, 3);

            const result = vector.lerp(new Vector3(4, 5, 6), 0.5);

            assert.equal(result, vector);
        });
    });

    describe('equals()', () => {
        it('returns true for identical components', () => {
            const vector = new Vector3(1, -2, 3.5);

            assert.equal(vector.equals(new Vector3(1, -2, 3.5)), true);
        });

        it('returns false when any component differs', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.equals(new Vector3(1.5, 2, 3)), false);
            assert.equal(vector.equals(new Vector3(1, 2.5, 3)), false);
            assert.equal(vector.equals(new Vector3(1, 2, 3.5)), false);
        });

        it('uses a tolerance of zero by default', () => {
            const vector = new Vector3(0.1 + 0.2, 0, 0);

            assert.equal(vector.equals(new Vector3(0.3, 0, 0)), false);
        });

        it('returns true when every difference is at most the tolerance', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.equals(new Vector3(1.5, 1.5, 3.5), 0.5), true);
        });

        it('returns false when any difference exceeds the tolerance', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.equals(new Vector3(1.5, 2, 3.75), 0.5), false);
        });
    });

    describe('notEquals()', () => {
        it('returns false for identical components', () => {
            const vector = new Vector3(1, -2, 3.5);

            assert.equal(vector.notEquals(new Vector3(1, -2, 3.5)), false);
        });

        it('returns true when any component differs', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.notEquals(new Vector3(1, 2, 3.5)), true);
        });

        it('returns false when every difference is at most the tolerance', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.notEquals(new Vector3(1.5, 1.5, 3.5), 0.5), false);
        });

        it('returns true when any difference exceeds the tolerance', () => {
            const vector = new Vector3(1, 2, 3);

            assert.equal(vector.notEquals(new Vector3(1.5, 2, 3.75), 0.5), true);
        });
    });

    describe('writeToArray()', () => {
        it('writes the components to the start of the array by default', () => {
            const vector = new Vector3(1, -2, 3.5);

            const target = vector.writeToArray([]);

            assert.deepEqual(target, [1, -2, 3.5]);
        });

        it('writes the components starting at the offset', () => {
            const vector = new Vector3(1, 2, 3);
            const target = [9, 9, 9, 9, 9];

            vector.writeToArray(target, 1);

            assert.deepEqual(target, [9, 1, 2, 3, 9]);
        });

        it('writes the components into a typed array', () => {
            const vector = new Vector3(1.5, -2, 0.25);
            const target = new Float32Array(3);

            vector.writeToArray(target);

            assert.deepEqual(Array.from(target), [1.5, -2, 0.25]);
        });

        it('returns the given array', () => {
            const vector = new Vector3(1, 2, 3);
            const target = [0, 0, 0];

            const result = vector.writeToArray(target);

            assert.equal(result, target);
        });
    });
});
