import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Vector3 } from './vector3.ts';
import { Quaternion } from './quaternion.ts';
import { Matrix4 } from './matrix4.ts';

import { assertClose, assertArrayClose } from '../testing/index.ts';

const IDENTITY_ROWS = Object.freeze([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

function readRows(matrix: Matrix4) {
    const elements = matrix.elements;
    const rows = [];

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            rows.push(elements[4 * j + i]);
        }
    }

    return rows;
}

function createGeneralMatrix() {
    return new Matrix4().set(
        2, 0, 1, 3,
        1, 1, 0, 2,
        0, 3, 1, 1,
        1, 0, 2, 1,
    );
}

function createOtherGeneralMatrix() {
    return new Matrix4().set(
        1, 2, 0, 1,
        0, 1, 3, 0,
        2, 0, 1, 1,
        1, 1, 0, 2,
    );
}

function createTranslation(x: number, y: number, z: number) {
    return new Matrix4().set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1,
    );
}

function createScale(x: number, y: number, z: number) {
    return new Matrix4().set(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1,
    );
}

function projectPoint(matrix: Matrix4, x: number, y: number, z: number) {
    const m = readRows(matrix);
    const w = m[12] * x + m[13] * y + m[14] * z + m[15];

    return [
        (m[0] * x + m[1] * y + m[2] * z + m[3]) / w,
        (m[4] * x + m[5] * y + m[6] * z + m[7]) / w,
        (m[8] * x + m[9] * y + m[10] * z + m[11]) / w,
    ];
}

describe('Matrix4', () => {
    describe('constructor()', () => {
        it('creates the identity matrix', () => {
            const matrix = new Matrix4();

            assert.deepEqual(readRows(matrix), IDENTITY_ROWS);
        });
    });

    describe('elements', () => {
        it('stores the elements in column-major order', () => {
            const matrix = new Matrix4().set(
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16,
            );

            assert.deepEqual(
                Array.from(matrix.elements),
                [1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16],
            );
        });

        it('returns a Float64Array of sixteen elements', () => {
            const matrix = new Matrix4();

            assert.ok(matrix.elements instanceof Float64Array);
            assert.equal(matrix.elements.length, 16);
        });

        it('returns the storage of the matrix', () => {
            const matrix = new Matrix4();

            matrix.elements[12] = 5;

            assert.equal(readRows(matrix)[3], 5);
            assert.equal(matrix.elements, matrix.elements);
        });

        it('cannot be replaced', () => {
            const matrix = new Matrix4();

            assert.throws(() => {
                // @ts-expect-error TS2540: elements is a read-only property.
                matrix.elements = new Float64Array(16);
            }, TypeError);
        });
    });

    describe('determinant', () => {
        it('returns one for the identity matrix', () => {
            const matrix = new Matrix4();

            assert.equal(matrix.determinant, 1);
        });

        it('returns the product of the diagonal for a diagonal matrix', () => {
            const matrix = createScale(2, 3, 4);

            assertClose(matrix.determinant, 24);
        });

        it('returns the determinant of a general matrix', () => {
            assertClose(createGeneralMatrix().determinant, -1);
            assertClose(createOtherGeneralMatrix().determinant, 16);
        });

        it('returns zero for a singular matrix', () => {
            const matrix = new Matrix4().set(
                1, 2, 3, 4,
                5, 6, 7, 8,
                2, 4, 6, 8,
                3, 1, 4, 1,
            );

            assertClose(matrix.determinant, 0);
        });

        it('leaves the matrix unchanged', () => {
            const matrix = createGeneralMatrix();

            void matrix.determinant;

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });
    });

    describe('set()', () => {
        it('assigns the elements row by row', () => {
            const matrix = new Matrix4();

            matrix.set(
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16,
            );

            assert.deepEqual(
                readRows(matrix),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            );
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.set(
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16,
            );

            assert.equal(result, matrix);
        });
    });

    describe('identity()', () => {
        it('sets the identity matrix', () => {
            const matrix = createGeneralMatrix();

            matrix.identity();

            assert.deepEqual(readRows(matrix), IDENTITY_ROWS);
        });

        it('returns this', () => {
            const matrix = createGeneralMatrix();

            const result = matrix.identity();

            assert.equal(result, matrix);
        });
    });

    describe('setFromArray()', () => {
        it('reads the elements in column-major order', () => {
            const matrix = new Matrix4();

            matrix.setFromArray([1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15, 4, 8, 12, 16]);

            assert.deepEqual(
                readRows(matrix),
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            );
        });

        it('reads the elements starting at the offset', () => {
            const matrix = new Matrix4();
            const array = [9, 9, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1, 9];

            matrix.setFromArray(array, 2);

            assert.deepEqual(readRows(matrix), readRows(createTranslation(2, 3, 4)));
        });

        it('reads the elements from a typed array', () => {
            const matrix = new Matrix4();

            matrix.setFromArray(new Float32Array([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1]));

            assert.deepEqual(readRows(matrix), readRows(createScale(2, 3, 4)));
        });

        it('reads an absent element as the element of the identity matrix', () => {
            const matrix = createGeneralMatrix();

            matrix.setFromArray([2, 7]);

            assert.deepEqual(readRows(matrix), [
                2, 0, 0, 0,
                7, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.setFromArray(IDENTITY_ROWS);

            assert.equal(result, matrix);
        });
    });

    describe('setFromQuaternion()', () => {
        it('sets the identity matrix for the identity quaternion', () => {
            const matrix = createGeneralMatrix();

            matrix.setFromQuaternion(new Quaternion());

            assertArrayClose(readRows(matrix), IDENTITY_ROWS);
        });

        it('sets the rotation by a quarter turn around the X axis', () => {
            const matrix = new Matrix4();

            matrix.setFromQuaternion(new Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2));

            assertArrayClose(readRows(matrix), [
                1, 0, 0, 0,
                0, 0, -1, 0,
                0, 1, 0, 0,
                0, 0, 0, 1,
            ]);
        });

        it('sets the rotation by a quarter turn around the Y axis', () => {
            const matrix = new Matrix4();

            matrix.setFromQuaternion(new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2));

            assertArrayClose(readRows(matrix), [
                0, 0, 1, 0,
                0, 1, 0, 0,
                -1, 0, 0, 0,
                0, 0, 0, 1,
            ]);
        });

        it('sets the rotation by a quarter turn around the Z axis', () => {
            const matrix = new Matrix4();

            matrix.setFromQuaternion(new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2));

            assertArrayClose(readRows(matrix), [
                0, -1, 0, 0,
                1, 0, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);
        });

        it('sets the rotation by a half turn around the Y axis', () => {
            const matrix = new Matrix4();

            matrix.setFromQuaternion(new Quaternion(0, 1, 0, 0));

            assertArrayClose(readRows(matrix), readRows(createScale(-1, 1, -1)));
        });

        it('sets the same matrix for the negation of the quaternion', () => {
            const matrix = new Matrix4();

            matrix.setFromQuaternion(new Quaternion(-Math.SQRT1_2, 0, 0, -Math.SQRT1_2));

            assertArrayClose(readRows(matrix), [
                1, 0, 0, 0,
                0, 0, -1, 0,
                0, 1, 0, 0,
                0, 0, 0, 1,
            ]);
        });

        it('composes rotations in the same order as quaternion multiplication', () => {
            const rotationX = new Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
            const rotationY = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);
            const matrixX = new Matrix4().setFromQuaternion(rotationX);
            const matrixY = new Matrix4().setFromQuaternion(rotationY);
            const matrix = new Matrix4();

            matrix.setFromQuaternion(rotationY.clone().multiply(rotationX));

            assertArrayClose(readRows(matrix), [
                0, 1, 0, 0,
                0, 0, -1, 0,
                -1, 0, 0, 0,
                0, 0, 0, 1,
            ]);
            assertArrayClose(readRows(matrix), readRows(matrixY.multiply(matrixX)));
        });

        it('leaves the quaternion unchanged', () => {
            const quaternion = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);

            new Matrix4().setFromQuaternion(quaternion);

            assert.deepEqual(quaternion.writeToArray([]), [0, Math.SQRT1_2, 0, Math.SQRT1_2]);
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.setFromQuaternion(new Quaternion());

            assert.equal(result, matrix);
        });
    });

    describe('compose()', () => {
        it('sets the rotation for a zero position and a unit scale', () => {
            const rotation = new Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);
            const matrix = createGeneralMatrix();

            matrix.compose(new Vector3(0, 0, 0), rotation, new Vector3(1, 1, 1));

            assertArrayClose(readRows(matrix), readRows(new Matrix4().setFromQuaternion(rotation)));
        });

        it('sets the translation for the identity rotation and a unit scale', () => {
            const matrix = new Matrix4();

            matrix.compose(new Vector3(5, -6, 7), new Quaternion(), new Vector3(1, 1, 1));

            assertArrayClose(readRows(matrix), readRows(createTranslation(5, -6, 7)));
        });

        it('sets the scale for the identity rotation and a zero position', () => {
            const matrix = new Matrix4();

            matrix.compose(new Vector3(0, 0, 0), new Quaternion(), new Vector3(2, 3, 4));

            assertArrayClose(readRows(matrix), readRows(createScale(2, 3, 4)));
        });

        it('applies the scale first, the rotation second, and the translation third', () => {
            const matrix = new Matrix4();

            matrix.compose(
                new Vector3(5, 6, 7),
                new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2),
                new Vector3(2, 3, 4),
            );

            assertArrayClose(readRows(matrix), [
                0, -3, 0, 5,
                2, 0, 0, 6,
                0, 0, 4, 7,
                0, 0, 0, 1,
            ]);
        });

        it('equals the product of the translation, rotation, and scale matrices', () => {
            const rotation = new Quaternion(0.5, 0.5, -0.5, 0.5);

            const product = createTranslation(1, -2, 3)
                .multiply(new Matrix4().setFromQuaternion(rotation))
                .multiply(createScale(2, -1, 0.5));

            const matrix = createGeneralMatrix();

            matrix.compose(new Vector3(1, -2, 3), rotation, new Vector3(2, -1, 0.5));

            assertArrayClose(readRows(matrix), readRows(product));
        });

        it('leaves the arguments unchanged', () => {
            const position = new Vector3(5, 6, 7);
            const rotation = new Quaternion(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            const scale = new Vector3(2, 3, 4);

            new Matrix4().compose(position, rotation, scale);

            assert.deepEqual(position.writeToArray([]), [5, 6, 7]);
            assert.deepEqual(rotation.writeToArray([]), [0, 0, Math.SQRT1_2, Math.SQRT1_2]);
            assert.deepEqual(scale.writeToArray([]), [2, 3, 4]);
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.compose(new Vector3(0, 0, 0), new Quaternion(), new Vector3(1, 1, 1));

            assert.equal(result, matrix);
        });
    });

    describe('perspective()', () => {
        it('sets the projection elements', () => {
            const matrix = createGeneralMatrix();

            matrix.perspective(Math.PI / 2, 2, 1, 3);

            assertArrayClose(readRows(matrix), [
                0.5, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 0.5, 1.5,
                0, 0, -1, 0,
            ]);
        });

        it('maps the near plane to depth 1', () => {
            const matrix = new Matrix4().perspective(Math.PI / 2, 2, 1, 3);

            assertClose(projectPoint(matrix, 0, 0, -1)[2], 1);
            assertClose(projectPoint(matrix, 2, 1, -1)[2], 1);
        });

        it('maps the far plane to depth 0', () => {
            const matrix = new Matrix4().perspective(Math.PI / 2, 2, 1, 3);

            assertClose(projectPoint(matrix, 0, 0, -3)[2], 0);
            assertClose(projectPoint(matrix, 6, 3, -3)[2], 0);
        });

        it('maps depth in proportion to the reciprocal distance', () => {
            const matrix = new Matrix4().perspective(Math.PI / 2, 2, 1, 3);

            assertClose(projectPoint(matrix, 0, 0, -1.5)[2], 0.5);
            assertClose(projectPoint(matrix, 0, 0, -2)[2], 0.25);
        });

        it('maps the top and bottom edges of the field of view to y of 1 and -1 at every distance', () => {
            const matrix = new Matrix4().perspective(Math.PI / 3, 1, 0.5, 10);

            for (const distance of [0.5, 2, 10]) {
                const top = distance / Math.sqrt(3);

                assertClose(projectPoint(matrix, 0, top, -distance)[1], 1);
                assertClose(projectPoint(matrix, 0, -top, -distance)[1], -1);
            }
        });

        it('maps the left and right edges to x of -1 and 1 for the aspect ratio', () => {
            const matrix = new Matrix4().perspective(Math.PI / 2, 2, 1, 3);

            assertClose(projectPoint(matrix, 2, 0, -1)[0], 1);
            assertClose(projectPoint(matrix, -2, 0, -1)[0], -1);
            assertClose(projectPoint(matrix, 6, 0, -3)[0], 1);
        });

        it('maps the view axis to the center', () => {
            const matrix = new Matrix4().perspective(Math.PI / 2, 2, 1, 3);

            const point = projectPoint(matrix, 0, 0, -2);

            assertClose(point[0], 0);
            assertClose(point[1], 0);
        });

        it('leaves the matrix unchanged for a zero field of view', () => {
            const matrix = createGeneralMatrix();

            matrix.perspective(0, 2, 1, 3);

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('leaves the matrix unchanged for a zero aspect ratio', () => {
            const matrix = createGeneralMatrix();

            matrix.perspective(Math.PI / 2, 0, 1, 3);

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('leaves the matrix unchanged for equal distances', () => {
            const matrix = createGeneralMatrix();

            matrix.perspective(Math.PI / 2, 2, 1, 1);

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.perspective(Math.PI / 2, 2, 1, 3);

            assert.equal(result, matrix);
        });
    });

    describe('copy()', () => {
        it('copies the elements of the source', () => {
            const matrix = new Matrix4();

            matrix.copy(createGeneralMatrix());

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('does not link the matrix to the source', () => {
            const matrix = new Matrix4();
            const source = createGeneralMatrix();

            matrix.copy(source);
            source.identity();

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('leaves the matrix unchanged when the source is the matrix itself', () => {
            const matrix = createGeneralMatrix();

            matrix.copy(matrix);

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('returns this', () => {
            const matrix = new Matrix4();

            const result = matrix.copy(createGeneralMatrix());

            assert.equal(result, matrix);
        });
    });

    describe('clone()', () => {
        it('returns a new matrix with the same elements', () => {
            const matrix = createGeneralMatrix();

            const clone = matrix.clone();

            assert.notEqual(clone, matrix);
            assert.ok(clone instanceof Matrix4);
            assert.deepEqual(readRows(clone), readRows(matrix));
        });

        it('returns a matrix independent of the original', () => {
            const matrix = createGeneralMatrix();

            const clone = matrix.clone();
            clone.identity();

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });
    });

    describe('multiply()', () => {
        it('computes the product of general matrices', () => {
            const matrix = createGeneralMatrix();

            matrix.multiply(createOtherGeneralMatrix());

            assertArrayClose(readRows(matrix), [
                7, 7, 1, 9,
                3, 5, 3, 5,
                3, 4, 10, 3,
                6, 3, 2, 5,
            ]);
        });

        it('is not commutative', () => {
            const matrix = createOtherGeneralMatrix();

            matrix.multiply(createGeneralMatrix());

            assertArrayClose(readRows(matrix), [
                5, 2, 3, 8,
                1, 10, 3, 5,
                5, 3, 5, 8,
                5, 1, 5, 7,
            ]);
        });

        it('composes transformations so that the operand applies first', () => {
            const matrix = createTranslation(1, 2, 3);

            matrix.multiply(createScale(2, 3, 4));

            assertArrayClose(readRows(matrix), [
                2, 0, 0, 1,
                0, 3, 0, 2,
                0, 0, 4, 3,
                0, 0, 0, 1,
            ]);
        });

        it('adds the offsets of two translations', () => {
            const matrix = createTranslation(1, 2, 3);

            matrix.multiply(createTranslation(4, -5, 6));

            assertArrayClose(readRows(matrix), readRows(createTranslation(5, -3, 9)));
        });

        it('leaves the matrix unchanged for the identity operand', () => {
            const matrix = createGeneralMatrix();

            matrix.multiply(new Matrix4());

            assertArrayClose(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('squares the matrix when the operand is the matrix itself', () => {
            const matrix = createScale(2, 3, 4);

            matrix.multiply(matrix);

            assertArrayClose(readRows(matrix), readRows(createScale(4, 9, 16)));
        });

        it('leaves the operand unchanged', () => {
            const operand = createOtherGeneralMatrix();

            createGeneralMatrix().multiply(operand);

            assert.deepEqual(readRows(operand), readRows(createOtherGeneralMatrix()));
        });

        it('returns this', () => {
            const matrix = createGeneralMatrix();

            const result = matrix.multiply(createOtherGeneralMatrix());

            assert.equal(result, matrix);
        });
    });

    describe('premultiply()', () => {
        it('multiplies in the opposite order', () => {
            const matrix = createOtherGeneralMatrix();

            matrix.premultiply(createGeneralMatrix());

            assertArrayClose(readRows(matrix), [
                7, 7, 1, 9,
                3, 5, 3, 5,
                3, 4, 10, 3,
                6, 3, 2, 5,
            ]);
        });

        it('composes transformations so that the operand applies second', () => {
            const matrix = createScale(2, 3, 4);

            matrix.premultiply(createTranslation(1, 2, 3));

            assertArrayClose(readRows(matrix), [
                2, 0, 0, 1,
                0, 3, 0, 2,
                0, 0, 4, 3,
                0, 0, 0, 1,
            ]);
        });

        it('squares the matrix when the operand is the matrix itself', () => {
            const matrix = createScale(2, 3, 4);

            matrix.premultiply(matrix);

            assertArrayClose(readRows(matrix), readRows(createScale(4, 9, 16)));
        });

        it('leaves the operand unchanged', () => {
            const operand = createGeneralMatrix();

            createOtherGeneralMatrix().premultiply(operand);

            assert.deepEqual(readRows(operand), readRows(createGeneralMatrix()));
        });

        it('returns this', () => {
            const matrix = createGeneralMatrix();

            const result = matrix.premultiply(createOtherGeneralMatrix());

            assert.equal(result, matrix);
        });
    });

    describe('transpose()', () => {
        it('swaps the rows and the columns', () => {
            const matrix = new Matrix4().set(
                1, 2, 3, 4,
                5, 6, 7, 8,
                9, 10, 11, 12,
                13, 14, 15, 16,
            );

            matrix.transpose();

            assert.deepEqual(readRows(matrix), [
                1, 5, 9, 13,
                2, 6, 10, 14,
                3, 7, 11, 15,
                4, 8, 12, 16,
            ]);
        });

        it('restores the matrix when applied twice', () => {
            const matrix = createGeneralMatrix();

            matrix.transpose().transpose();

            assert.deepEqual(readRows(matrix), readRows(createGeneralMatrix()));
        });

        it('returns this', () => {
            const matrix = createGeneralMatrix();

            const result = matrix.transpose();

            assert.equal(result, matrix);
        });
    });

    describe('invert()', () => {
        it('inverts a general matrix', () => {
            const matrix = createGeneralMatrix();

            matrix.invert();

            assertArrayClose(readRows(matrix), [
                -11, 15, -5, 8,
                -3, 4, -1, 2,
                2, -3, 1, -1,
                7, -9, 3, -5,
            ]);
        });

        it('yields the identity matrix when multiplied by the original', () => {
            const matrix = createOtherGeneralMatrix();

            matrix.invert().multiply(createOtherGeneralMatrix());

            assertArrayClose(readRows(matrix), IDENTITY_ROWS);
        });

        it('inverts the diagonal of a diagonal matrix', () => {
            const matrix = createScale(2, 4, 5);

            matrix.invert();

            assertArrayClose(readRows(matrix), readRows(createScale(0.5, 0.25, 0.2)));
        });

        it('negates the offset of a translation', () => {
            const matrix = createTranslation(1, -2, 3);

            matrix.invert();

            assertArrayClose(readRows(matrix), readRows(createTranslation(-1, 2, -3)));
        });

        it('sets a rotation to its transpose', () => {
            const matrix = new Matrix4().set(
                0, -1, 0, 0,
                1, 0, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            );

            matrix.invert();

            assertArrayClose(readRows(matrix), [
                0, 1, 0, 0,
                -1, 0, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ]);
        });

        it('leaves a singular matrix unchanged', () => {
            const matrix = new Matrix4().set(
                1, 2, 3, 4,
                2, 4, 6, 8,
                0, 1, 0, 1,
                1, 0, 1, 0,
            );

            matrix.invert();

            assert.deepEqual(readRows(matrix), [
                1, 2, 3, 4,
                2, 4, 6, 8,
                0, 1, 0, 1,
                1, 0, 1, 0,
            ]);
        });

        it('leaves the zero matrix unchanged', () => {
            const matrix = new Matrix4().setFromArray(new Float64Array(16));

            matrix.invert();

            assert.deepEqual(readRows(matrix), new Array(16).fill(0));
        });

        it('returns this', () => {
            const matrix = createGeneralMatrix();

            const result = matrix.invert();

            assert.equal(result, matrix);
        });
    });

    describe('equals()', () => {
        it('returns true for identical elements', () => {
            const matrix = createGeneralMatrix();

            assert.equal(matrix.equals(createGeneralMatrix()), true);
        });

        it('returns false when any element differs', () => {
            const matrix = new Matrix4();

            for (let i = 0; i < 16; i++) {
                const other = new Matrix4();
                other.elements[i] += 0.5;

                assert.equal(matrix.equals(other), false, `element ${i}`);
            }
        });

        it('uses a tolerance of zero by default', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            matrix.elements[0] = 0.1 + 0.2;
            other.elements[0] = 0.3;

            assert.equal(matrix.equals(other), false);
        });

        it('returns true when every difference is at most the tolerance', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            other.elements.fill(0.5);
            other.elements[0] = 1.5;

            assert.equal(matrix.equals(other, 0.5), true);
        });

        it('returns false when any difference exceeds the tolerance', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            other.elements[15] = 1.75;

            assert.equal(matrix.equals(other, 0.5), false);
        });
    });

    describe('notEquals()', () => {
        it('returns false for identical elements', () => {
            const matrix = createGeneralMatrix();

            assert.equal(matrix.notEquals(createGeneralMatrix()), false);
        });

        it('returns true when any element differs', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            other.elements[7] = 0.5;

            assert.equal(matrix.notEquals(other), true);
        });

        it('returns false when every difference is at most the tolerance', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            other.elements.fill(0.5);
            other.elements[0] = 1.5;

            assert.equal(matrix.notEquals(other, 0.5), false);
        });

        it('returns true when any difference exceeds the tolerance', () => {
            const matrix = new Matrix4();
            const other = new Matrix4();

            other.elements[15] = 1.75;

            assert.equal(matrix.notEquals(other, 0.5), true);
        });
    });

    describe('writeToArray()', () => {
        it('writes the elements in column-major order', () => {
            const matrix = createTranslation(2, 3, 4);

            const target = matrix.writeToArray([]);

            assert.deepEqual(target, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1]);
        });

        it('writes the elements starting at the offset', () => {
            const matrix = createTranslation(2, 3, 4);
            const target = [9, 9, 9];

            matrix.writeToArray(target, 2);

            assert.deepEqual(target, [9, 9, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1]);
        });

        it('writes the elements into a typed array', () => {
            const matrix = createScale(1.5, -2, 0.25);
            const target = new Float32Array(16);

            matrix.writeToArray(target);

            assert.deepEqual(
                Array.from(target),
                [1.5, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0.25, 0, 0, 0, 0, 1],
            );
        });

        it('returns the given array', () => {
            const matrix = new Matrix4();
            const target = new Array(16).fill(0);

            const result = matrix.writeToArray(target);

            assert.equal(result, target);
        });
    });
});
