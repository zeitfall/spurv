import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VertexFormat } from './vertex-format.ts';
import { VertexAttribute } from './vertex-attribute.ts';

function createAttributeA() {
    return new VertexAttribute([1, 2, 3, 4, 5, 6], VertexFormat.FLOAT32X3);
}

function createAttributeB() {
    return new VertexAttribute([1, 2, 3, 4, 5, 6], VertexFormat.FLOAT32X2);
}

describe('VertexAttribute', () => {
    describe('constructor()', () => {
        it('stores the given components', () => {
            const attribute = new VertexAttribute([1, 2, 3, 4, 5, 6], VertexFormat.FLOAT32X3);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3, 4, 5, 6]);
        });

        it('stores the given format', () => {
            const attribute = new VertexAttribute([1, 2, 3, 4, 5, 6], VertexFormat.FLOAT32X2);

            assert.equal(attribute.format, VertexFormat.FLOAT32X2);
        });

        it('copies a plain array', () => {
            const array = [1, 2, 3];
            const attribute = new VertexAttribute(array, VertexFormat.FLOAT32X3);

            array[0] = 9;

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3]);
        });

        it('copies a typed array without sharing its memory', () => {
            const array = new Float32Array([1, 2, 3]);
            const attribute = new VertexAttribute(array, VertexFormat.FLOAT32X3);

            array[0] = 9;

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3]);
        });

        it('converts the elements of a typed array of another class', () => {
            const attribute = new VertexAttribute(new Uint8Array([1, 2, 255]), VertexFormat.FLOAT32X3);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 255]);
        });

        it('throws for a value that is not a vertex format', () => {
            for (const format of ['float32x4', 'FLOAT32X3', '', 3, null]) {
                // @ts-expect-error TS2345: The argument is deliberately not a vertex format.
                assert.throws(() => new VertexAttribute([1, 2, 3], format), {
                    name: 'RangeError',
                    message: /^VertexAttribute\.constructor: /,
                });
            }
        });

        it('throws for an empty array', () => {
            assert.throws(() => new VertexAttribute([], VertexFormat.FLOAT32X3), {
                name: 'RangeError',
                message: /^VertexAttribute\.constructor: /,
            });
        });

        it('throws for an array whose length is not a multiple of the number of components', () => {
            assert.throws(() => new VertexAttribute([1, 2, 3, 4], VertexFormat.FLOAT32X3), {
                name: 'RangeError',
                message: /^VertexAttribute\.constructor: /,
            });

            assert.throws(() => new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X2), {
                name: 'RangeError',
                message: /^VertexAttribute\.constructor: /,
            });
        });

        it('throws for an array buffer, whose memory a typed array would share', () => {
            // @ts-expect-error TS2345: The argument is deliberately not an array of numbers.
            assert.throws(() => new VertexAttribute(new ArrayBuffer(12), VertexFormat.FLOAT32X3), {
                name: 'RangeError',
                message: /^VertexAttribute\.constructor: /,
            });
        });
    });

    describe('format', () => {
        it('throws on assignment', () => {
            const attribute = createAttributeA();

            assert.throws(() => Object.assign(attribute, { format: VertexFormat.FLOAT32X2 }), TypeError);
        });
    });

    describe('version', () => {
        it('starts at zero', () => {
            const attribute = createAttributeA();

            assert.equal(attribute.version, 0);
        });

        it('remains unchanged when the components are written into an array', () => {
            const attribute = createAttributeA();

            attribute.writeToArray([]);
            attribute.writeVertexToArray(0, []);

            assert.equal(attribute.version, 0);
        });

        it('throws on assignment', () => {
            const attribute = createAttributeA();

            assert.throws(() => Object.assign(attribute, { version: 1 }), TypeError);
        });
    });

    describe('vertexCount', () => {
        it('divides the number of components by the number of components of the format', () => {
            assert.equal(createAttributeA().vertexCount, 2);
            assert.equal(createAttributeB().vertexCount, 3);
        });

        it('throws on assignment', () => {
            const attribute = createAttributeA();

            assert.throws(() => Object.assign(attribute, { vertexCount: 1 }), TypeError);
        });
    });

    describe('setFromArray()', () => {
        it('assigns the components of all vertices', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([10, 20, 30, 40, 50, 60]);

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 40, 50, 60]);
        });

        it('reads the components from the given offset', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([9, 9, 10, 20, 30, 40, 50, 60], 2);

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 40, 50, 60]);
        });

        it('reads the components from a typed array', () => {
            const attribute = createAttributeA();

            attribute.setFromArray(new Float32Array([10, 20, 30, 40, 50, 60]));

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 40, 50, 60]);
        });

        it('ignores the elements beyond the last component', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([10, 20, 30, 40, 50, 60, 70, 80]);

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 40, 50, 60]);
            assert.equal(attribute.vertexCount, 2);
        });

        it('leaves a component unchanged when its element is absent from the array', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([10, 20, 30]);

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 4, 5, 6]);
        });

        it('leaves a component unchanged when the offset moves its element beyond the array', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([10, 20, 30, 40, 50, 60], 2);

            assert.deepEqual(attribute.writeToArray([]), [30, 40, 50, 60, 5, 6]);
        });

        it('copies the components, so a later change to the array does not affect the attribute', () => {
            const attribute = createAttributeA();
            const array = [10, 20, 30, 40, 50, 60];

            attribute.setFromArray(array);
            array[0] = 9;

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 40, 50, 60]);
        });

        it('increases the version by one', () => {
            const attribute = createAttributeA();

            attribute.setFromArray([10, 20, 30, 40, 50, 60]);

            assert.equal(attribute.version, 1);
        });

        it('returns this attribute', () => {
            const attribute = createAttributeA();

            assert.equal(attribute.setFromArray([10, 20, 30, 40, 50, 60]), attribute);
        });
    });

    describe('setVertexFromArray()', () => {
        it('assigns the components of the vertex at the given index', () => {
            const attribute = createAttributeA();

            attribute.setVertexFromArray(1, [10, 20, 30]);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3, 10, 20, 30]);
        });

        it('assigns as many components as the format has', () => {
            const attribute = createAttributeB();

            attribute.setVertexFromArray(1, [10, 20, 30]);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 10, 20, 5, 6]);
        });

        it('reads the components from the given offset', () => {
            const attribute = createAttributeA();

            attribute.setVertexFromArray(0, [9, 10, 20, 30], 1);

            assert.deepEqual(attribute.writeToArray([]), [10, 20, 30, 4, 5, 6]);
        });

        it('leaves a component unchanged when its element is absent from the array', () => {
            const attribute = createAttributeA();

            attribute.setVertexFromArray(1, [10]);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3, 10, 5, 6]);
        });

        it('changes no component for an index of a vertex outside the attribute', () => {
            const attribute = createAttributeA();

            attribute.setVertexFromArray(2, [10, 20, 30]);
            attribute.setVertexFromArray(-1, [10, 20, 30]);

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3, 4, 5, 6]);
        });

        it('increases the version by one', () => {
            const attribute = createAttributeA();

            attribute.setVertexFromArray(1, [10, 20, 30]);

            assert.equal(attribute.version, 1);
        });

        it('returns this attribute', () => {
            const attribute = createAttributeA();

            assert.equal(attribute.setVertexFromArray(1, [10, 20, 30]), attribute);
        });
    });

    describe('writeToArray()', () => {
        it('writes the components of all vertices', () => {
            const attribute = createAttributeA();

            assert.deepEqual(attribute.writeToArray([]), [1, 2, 3, 4, 5, 6]);
        });

        it('writes the components at the given offset and leaves the other elements unchanged', () => {
            const attribute = createAttributeA();
            const array = [9, 9, 0, 0, 0, 0, 0, 0, 9];

            attribute.writeToArray(array, 2);

            assert.deepEqual(array, [9, 9, 1, 2, 3, 4, 5, 6, 9]);
        });

        it('writes the components into a typed array', () => {
            const attribute = createAttributeA();
            const array = new Float32Array(6);

            attribute.writeToArray(array);

            assert.deepEqual(Array.from(array), [1, 2, 3, 4, 5, 6]);
        });

        it('returns the given array', () => {
            const attribute = createAttributeA();
            const array: number[] = [];

            assert.equal(attribute.writeToArray(array), array);
        });
    });

    describe('writeVertexToArray()', () => {
        it('writes the components of the vertex at the given index', () => {
            const attribute = createAttributeA();

            assert.deepEqual(attribute.writeVertexToArray(1, []), [4, 5, 6]);
        });

        it('writes as many components as the format has', () => {
            const attribute = createAttributeB();

            assert.deepEqual(attribute.writeVertexToArray(1, []), [3, 4]);
        });

        it('writes the components at the given offset and leaves the other elements unchanged', () => {
            const attribute = createAttributeA();
            const array = [9, 0, 0, 0, 9];

            attribute.writeVertexToArray(0, array, 1);

            assert.deepEqual(array, [9, 1, 2, 3, 9]);
        });

        it('writes undefined elements for an index of a vertex outside the attribute', () => {
            const attribute = createAttributeA();

            assert.deepEqual(attribute.writeVertexToArray(2, []), [undefined, undefined, undefined]);
        });

        it('returns the given array', () => {
            const attribute = createAttributeA();
            const array: number[] = [];

            assert.equal(attribute.writeVertexToArray(0, array), array);
        });
    });
});
