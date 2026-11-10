import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Matrix4 } from '../math/index.ts';

import { PerspectiveProjection } from './perspective-projection.ts';

import { assertArrayClose } from '../testing/index.ts';

const INVALID_FIELDS_OF_VIEW = Object.freeze([0, -1, Math.PI, 4, Infinity, NaN]);
const INVALID_DISTANCES = Object.freeze([0, -1, Infinity, -Infinity, NaN]);

function createGeneralMatrix() {
    return new Matrix4().set(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
    );
}

describe('PerspectiveProjection', () => {
    describe('constructor()', () => {
        it('stores the field of view and the clipping distances', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.equal(projection.fieldOfView, 1);
            assert.equal(projection.nearDistance, 0.5);
            assert.equal(projection.farDistance, 100);
        });

        it('throws for a field of view that is not greater than zero and less than pi', () => {
            for (const fieldOfView of INVALID_FIELDS_OF_VIEW) {
                assert.throws(() => new PerspectiveProjection(fieldOfView, 0.5, 100), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.constructor: /,
                });
            }
        });

        it('throws for a near distance that is not positive and finite', () => {
            for (const nearDistance of INVALID_DISTANCES) {
                assert.throws(() => new PerspectiveProjection(1, nearDistance, 100), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.constructor: /,
                });
            }
        });

        it('throws for a far distance that is not positive and finite', () => {
            for (const farDistance of INVALID_DISTANCES) {
                assert.throws(() => new PerspectiveProjection(1, 0.5, farDistance), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.constructor: /,
                });
            }
        });

        it('accepts a near distance greater than the far distance', () => {
            const projection = new PerspectiveProjection(1, 100, 0.5);

            assert.equal(projection.nearDistance, 100);
            assert.equal(projection.farDistance, 0.5);
        });
    });

    describe('fieldOfView', () => {
        it('throws on assignment', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => Object.assign(projection, { fieldOfView: 2 }), TypeError);
        });
    });

    describe('nearDistance', () => {
        it('throws on assignment', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => Object.assign(projection, { nearDistance: 2 }), TypeError);
        });
    });

    describe('farDistance', () => {
        it('throws on assignment', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => Object.assign(projection, { farDistance: 2 }), TypeError);
        });
    });

    describe('setFieldOfView()', () => {
        it('assigns the field of view', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            projection.setFieldOfView(2);

            assert.equal(projection.fieldOfView, 2);
        });

        it('returns this projection', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.equal(projection.setFieldOfView(2), projection);
        });

        it('throws for a field of view that is not greater than zero and less than pi', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            for (const fieldOfView of INVALID_FIELDS_OF_VIEW) {
                assert.throws(() => projection.setFieldOfView(fieldOfView), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.setFieldOfView: /,
                });
            }
        });

        it('keeps the previous field of view when it throws', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => projection.setFieldOfView(0), RangeError);

            assert.equal(projection.fieldOfView, 1);
        });
    });

    describe('setNearDistance()', () => {
        it('assigns the near distance', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            projection.setNearDistance(2);

            assert.equal(projection.nearDistance, 2);
        });

        it('returns this projection', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.equal(projection.setNearDistance(2), projection);
        });

        it('throws for a distance that is not positive and finite', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            for (const nearDistance of INVALID_DISTANCES) {
                assert.throws(() => projection.setNearDistance(nearDistance), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.setNearDistance: /,
                });
            }
        });

        it('keeps the previous near distance when it throws', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => projection.setNearDistance(0), RangeError);

            assert.equal(projection.nearDistance, 0.5);
        });

        it('accepts a distance greater than the far distance', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            projection.setNearDistance(200);

            assert.equal(projection.nearDistance, 200);
        });
    });

    describe('setFarDistance()', () => {
        it('assigns the far distance', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            projection.setFarDistance(200);

            assert.equal(projection.farDistance, 200);
        });

        it('returns this projection', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.equal(projection.setFarDistance(200), projection);
        });

        it('throws for a distance that is not positive and finite', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            for (const farDistance of INVALID_DISTANCES) {
                assert.throws(() => projection.setFarDistance(farDistance), {
                    name: 'RangeError',
                    message: /^PerspectiveProjection\.setFarDistance: /,
                });
            }
        });

        it('keeps the previous far distance when it throws', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            assert.throws(() => projection.setFarDistance(0), RangeError);

            assert.equal(projection.farDistance, 100);
        });

        it('accepts a distance less than the near distance', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);

            projection.setFarDistance(0.25);

            assert.equal(projection.farDistance, 0.25);
        });
    });

    describe('computeMatrixInto()', () => {
        it('computes the perspective matrix with reversed depth for the aspect ratio', () => {
            const projection = new PerspectiveProjection(Math.PI / 2, 1, 3);
            const target = createGeneralMatrix();

            projection.computeMatrixInto(target, 2);

            const expected = new Matrix4().set(
                0.5, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 0.5, 1.5,
                0, 0, -1, 0,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('computes the matrix from the current settings', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);
            const target = createGeneralMatrix();

            projection.setFieldOfView(Math.PI / 2).setNearDistance(1).setFarDistance(3);
            projection.computeMatrixInto(target, 1);

            const expected = new Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 0.5, 1.5,
                0, 0, -1, 0,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('returns the given matrix', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);
            const target = new Matrix4();

            assert.equal(projection.computeMatrixInto(target, 1), target);
        });

        it('leaves the given matrix unchanged for an aspect ratio of zero', () => {
            const projection = new PerspectiveProjection(1, 0.5, 100);
            const target = createGeneralMatrix();

            projection.computeMatrixInto(target, 0);

            assert.deepEqual(target.writeToArray([]), createGeneralMatrix().writeToArray([]));
        });

        it('leaves the given matrix unchanged for equal clipping distances', () => {
            const projection = new PerspectiveProjection(1, 2, 2);
            const target = createGeneralMatrix();

            projection.computeMatrixInto(target, 1);

            assert.deepEqual(target.writeToArray([]), createGeneralMatrix().writeToArray([]));
        });
    });
});
