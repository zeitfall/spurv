import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getGeometryIndexArray } from './geometry-index-arrays.ts';
import { VertexAttributeName } from './vertex-attribute-name.ts';
import { VertexFormat } from './vertex-format.ts';
import { VertexAttribute } from './vertex-attribute.ts';
import { Geometry } from './geometry.ts';

function createPositions(vertexCount: number) {
    return new VertexAttribute(new Array(3 * vertexCount).fill(1), VertexFormat.FLOAT32X3);
}

function createTextureCoordinates(vertexCount: number) {
    return new VertexAttribute(new Array(2 * vertexCount).fill(1), VertexFormat.FLOAT32X2);
}

describe('Geometry', () => {
    describe('constructor()', () => {
        it('creates a geometry without attributes', () => {
            const geometry = new Geometry();

            assert.equal(geometry.vertexCount, 0);
            assert.equal(geometry.getAttribute(VertexAttributeName.POSITION), null);
            assert.equal(geometry.getAttribute(VertexAttributeName.NORMAL), null);
            assert.equal(geometry.getAttribute(VertexAttributeName.UV), null);
        });

        it('creates a geometry without indices', () => {
            const geometry = new Geometry();

            assert.equal(geometry.indexCount, 0);
            assert.equal(getGeometryIndexArray(geometry), null);
        });

        it('starts the version at zero', () => {
            const geometry = new Geometry();

            assert.equal(geometry.version, 0);
        });
    });

    describe('vertexCount', () => {
        it('throws on assignment', () => {
            const geometry = new Geometry();

            assert.throws(() => Object.assign(geometry, { vertexCount: 3 }), TypeError);
        });
    });

    describe('indexCount', () => {
        it('throws on assignment', () => {
            const geometry = new Geometry();

            assert.throws(() => Object.assign(geometry, { indexCount: 3 }), TypeError);
        });
    });

    describe('version', () => {
        it('remains unchanged when the components of an attribute are assigned', () => {
            const geometry = new Geometry();
            const positions = createPositions(3);

            geometry.setAttribute(VertexAttributeName.POSITION, positions);
            positions.setFromArray([2, 2, 2, 2, 2, 2, 2, 2, 2]);

            assert.equal(geometry.version, 1);
        });

        it('remains unchanged when an attribute is looked up or the indices are written', () => {
            const geometry = new Geometry();

            geometry.getAttribute(VertexAttributeName.POSITION);
            geometry.writeIndicesToArray([]);

            assert.equal(geometry.version, 0);
        });

        it('throws on assignment', () => {
            const geometry = new Geometry();

            assert.throws(() => Object.assign(geometry, { version: 1 }), TypeError);
        });
    });

    describe('setAttribute()', () => {
        it('holds the given attribute under the given name', () => {
            const geometry = new Geometry();
            const positions = createPositions(3);

            geometry.setAttribute(VertexAttributeName.POSITION, positions);

            assert.equal(geometry.getAttribute(VertexAttributeName.POSITION), positions);
            assert.equal(geometry.getAttribute(VertexAttributeName.NORMAL), null);
        });

        it('takes the vertex count of the first attribute', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));

            assert.equal(geometry.vertexCount, 4);
        });

        it('accepts an attribute of the same vertex count and another format under another name', () => {
            const geometry = new Geometry();
            const positions = createPositions(4);
            const textureCoordinates = createTextureCoordinates(4);

            geometry.setAttribute(VertexAttributeName.POSITION, positions);
            geometry.setAttribute(VertexAttributeName.UV, textureCoordinates);

            assert.equal(geometry.getAttribute(VertexAttributeName.POSITION), positions);
            assert.equal(geometry.getAttribute(VertexAttributeName.UV), textureCoordinates);
            assert.equal(geometry.vertexCount, 4);
        });

        it('replaces the attribute under the given name', () => {
            const geometry = new Geometry();
            const positionsA = createPositions(4);
            const positionsB = createPositions(4);

            geometry.setAttribute(VertexAttributeName.POSITION, positionsA);
            geometry.setAttribute(VertexAttributeName.UV, createTextureCoordinates(4));
            geometry.setAttribute(VertexAttributeName.POSITION, positionsB);

            assert.equal(geometry.getAttribute(VertexAttributeName.POSITION), positionsB);
        });

        it('accepts another vertex count when it replaces the only attribute', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));
            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(6));

            assert.equal(geometry.vertexCount, 6);
        });

        it('accepts one attribute under two names and in two geometries', () => {
            const geometryA = new Geometry();
            const geometryB = new Geometry();
            const attribute = createPositions(4);

            geometryA.setAttribute(VertexAttributeName.POSITION, attribute);
            geometryA.setAttribute(VertexAttributeName.NORMAL, attribute);
            geometryB.setAttribute(VertexAttributeName.POSITION, attribute);

            assert.equal(geometryA.getAttribute(VertexAttributeName.POSITION), attribute);
            assert.equal(geometryA.getAttribute(VertexAttributeName.NORMAL), attribute);
            assert.equal(geometryB.getAttribute(VertexAttributeName.POSITION), attribute);
        });

        it('throws for an attribute whose vertex count differs from an attribute under another name', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));

            assert.throws(() => geometry.setAttribute(VertexAttributeName.UV, createTextureCoordinates(3)), {
                name: 'RangeError',
                message: /^Geometry\.setAttribute: /,
            });
        });

        it('throws for a replacement whose vertex count differs from an attribute under another name', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));
            geometry.setAttribute(VertexAttributeName.UV, createTextureCoordinates(4));

            assert.throws(() => geometry.setAttribute(VertexAttributeName.POSITION, createPositions(6)), {
                name: 'RangeError',
                message: /^Geometry\.setAttribute: /,
            });
        });

        it('throws for a value that is not a vertex attribute name', () => {
            const geometry = new Geometry();

            for (const name of ['position', 'COLOR', '', 3, null]) {
                // @ts-expect-error TS2345: The argument is deliberately not a vertex attribute name.
                assert.throws(() => geometry.setAttribute(name, createPositions(4)), {
                    name: 'RangeError',
                    message: /^Geometry\.setAttribute: /,
                });
            }
        });

        it('keeps its attributes, its vertex count, and its version when it throws', () => {
            const geometry = new Geometry();
            const positions = createPositions(4);

            geometry.setAttribute(VertexAttributeName.POSITION, positions);

            assert.throws(() => geometry.setAttribute(VertexAttributeName.UV, createTextureCoordinates(3)), RangeError);

            assert.equal(geometry.getAttribute(VertexAttributeName.POSITION), positions);
            assert.equal(geometry.getAttribute(VertexAttributeName.UV), null);
            assert.equal(geometry.vertexCount, 4);
            assert.equal(geometry.version, 1);
        });

        it('increases the version by one', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));
            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));

            assert.equal(geometry.version, 2);
        });

        it('returns this geometry', () => {
            const geometry = new Geometry();

            assert.equal(geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4)), geometry);
        });
    });

    describe('getAttribute()', () => {
        it('returns null for a name under which the geometry holds no attribute', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(4));

            assert.equal(geometry.getAttribute(VertexAttributeName.UV), null);
        });
    });

    describe('setIndices()', () => {
        it('holds a copy of the given 16-bit indices', () => {
            const geometry = new Geometry();
            const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

            geometry.setIndices(indices);

            const array = getGeometryIndexArray(geometry);

            assert.ok(array instanceof Uint16Array);
            assert.deepEqual(Array.from(array), [0, 1, 2, 0, 2, 3]);
            assert.notEqual(array, indices);
            assert.notEqual(array.buffer, indices.buffer);
        });

        it('holds a copy of the given 32-bit indices', () => {
            const geometry = new Geometry();
            const indices = new Uint32Array([0, 1, 70000]);

            geometry.setIndices(indices);

            const array = getGeometryIndexArray(geometry);

            assert.ok(array instanceof Uint32Array);
            assert.deepEqual(Array.from(array), [0, 1, 70000]);
            assert.notEqual(array.buffer, indices.buffer);
        });

        it('assigns the number of indices', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2, 0, 2, 3]));

            assert.equal(geometry.indexCount, 6);
        });

        it('copies the indices, so a later change to the array does not affect the geometry', () => {
            const geometry = new Geometry();
            const indices = new Uint16Array([0, 1, 2]);

            geometry.setIndices(indices);
            indices[0] = 9;

            assert.deepEqual(geometry.writeIndicesToArray([]), [0, 1, 2]);
        });

        it('replaces the previous indices', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2]));
            geometry.setIndices(new Uint32Array([3, 4, 5, 3, 5, 6]));

            assert.ok(getGeometryIndexArray(geometry) instanceof Uint32Array);
            assert.deepEqual(geometry.writeIndicesToArray([]), [3, 4, 5, 3, 5, 6]);
            assert.equal(geometry.indexCount, 6);
        });

        it('removes the indices for null', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2]));
            geometry.setIndices(null);

            assert.equal(geometry.indexCount, 0);
            assert.equal(getGeometryIndexArray(geometry), null);
        });

        it('accepts indices that refer to no vertex of the attributes', () => {
            const geometry = new Geometry();

            geometry.setAttribute(VertexAttributeName.POSITION, createPositions(3));
            geometry.setIndices(new Uint16Array([0, 1, 9]));

            assert.equal(geometry.indexCount, 3);
        });

        it('throws for a value that is neither an array of 16-bit or 32-bit unsigned integers nor null', () => {
            const geometry = new Geometry();
            const values = [
                [0, 1, 2],
                new Float32Array(3),
                new Uint8Array(3),
                new ArrayBuffer(12),
                'abc',
                3,
                undefined,
            ];

            for (const value of values) {
                // @ts-expect-error TS2345: The argument is deliberately not an array of indices.
                assert.throws(() => geometry.setIndices(value), {
                    name: 'TypeError',
                    message: /^Geometry\.setIndices: /,
                });
            }
        });

        it('throws for an empty array', () => {
            const geometry = new Geometry();

            assert.throws(() => geometry.setIndices(new Uint16Array(0)), {
                name: 'RangeError',
                message: /^Geometry\.setIndices: /,
            });
        });

        it('throws for an array whose length is not a multiple of 3', () => {
            const geometry = new Geometry();

            for (const length of [1, 2, 4, 5]) {
                assert.throws(() => geometry.setIndices(new Uint32Array(length)), {
                    name: 'RangeError',
                    message: /^Geometry\.setIndices: /,
                });
            }
        });

        it('keeps its indices and its version when it throws', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2]));

            assert.throws(() => geometry.setIndices(new Uint16Array(4)), RangeError);

            assert.deepEqual(geometry.writeIndicesToArray([]), [0, 1, 2]);
            assert.equal(geometry.version, 1);
        });

        it('increases the version by one for an array and for null', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2]));

            assert.equal(geometry.version, 1);

            geometry.setIndices(null);

            assert.equal(geometry.version, 2);
        });

        it('returns this geometry', () => {
            const geometry = new Geometry();

            assert.equal(geometry.setIndices(new Uint16Array([0, 1, 2])), geometry);
            assert.equal(geometry.setIndices(null), geometry);
        });
    });

    describe('writeIndicesToArray()', () => {
        it('writes the indices', () => {
            const geometry = new Geometry();

            geometry.setIndices(new Uint16Array([0, 1, 2, 0, 2, 3]));

            assert.deepEqual(geometry.writeIndicesToArray([]), [0, 1, 2, 0, 2, 3]);
        });

        it('writes the indices at the given offset and leaves the other elements unchanged', () => {
            const geometry = new Geometry();
            const array = [9, 9, 0, 0, 0, 9];

            geometry.setIndices(new Uint16Array([4, 5, 6]));
            geometry.writeIndicesToArray(array, 2);

            assert.deepEqual(array, [9, 9, 4, 5, 6, 9]);
        });

        it('writes the indices into a typed array', () => {
            const geometry = new Geometry();
            const array = new Uint32Array(3);

            geometry.setIndices(new Uint16Array([4, 5, 6]));
            geometry.writeIndicesToArray(array);

            assert.deepEqual(Array.from(array), [4, 5, 6]);
        });

        it('writes nothing for a geometry without indices', () => {
            const geometry = new Geometry();
            const array = [9, 9, 9];

            geometry.writeIndicesToArray(array);

            assert.deepEqual(array, [9, 9, 9]);
        });

        it('returns the given array', () => {
            const geometry = new Geometry();
            const array: number[] = [];

            assert.equal(geometry.writeIndicesToArray(array), array);

            geometry.setIndices(new Uint16Array([0, 1, 2]));

            assert.equal(geometry.writeIndicesToArray(array), array);
        });
    });
});
