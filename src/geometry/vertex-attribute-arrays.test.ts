import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVertexAttributeArray, setVertexAttributeArray } from './vertex-attribute-arrays.ts';
import { VertexFormat } from './vertex-format.ts';
import { VertexAttribute } from './vertex-attribute.ts';

describe('getVertexAttributeArray()', () => {
    it('returns the array that holds the components of the attribute', () => {
        const attribute = new VertexAttribute([1, 2, 3, 4, 5, 6], VertexFormat.FLOAT32X3);
        const array = getVertexAttributeArray(attribute);

        assert.ok(array instanceof Float32Array);
        assert.deepEqual(Array.from(array), [1, 2, 3, 4, 5, 6]);
    });

    it('returns the same array on every call', () => {
        const attribute = new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X3);

        assert.equal(getVertexAttributeArray(attribute), getVertexAttributeArray(attribute));
    });

    it('returns the storage of the attribute, which reflects a later assignment', () => {
        const attribute = new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X3);
        const array = getVertexAttributeArray(attribute);

        attribute.setFromArray([10, 20, 30]);

        assert.deepEqual(Array.from(array), [10, 20, 30]);
    });

    it('returns an array that shares no memory with the array given to the attribute', () => {
        const source = new Float32Array([1, 2, 3]);
        const attribute = new VertexAttribute(source, VertexFormat.FLOAT32X3);

        assert.notEqual(getVertexAttributeArray(attribute), source);
        assert.notEqual(getVertexAttributeArray(attribute).buffer, source.buffer);
    });

    it('returns a separate array for each attribute', () => {
        const attributeA = new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X3);
        const attributeB = new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X3);

        assert.notEqual(getVertexAttributeArray(attributeA), getVertexAttributeArray(attributeB));
    });
});

describe('setVertexAttributeArray()', () => {
    it('records the given array for the given attribute', () => {
        const attribute = new VertexAttribute([1, 2, 3], VertexFormat.FLOAT32X3);
        const array = new Float32Array([10, 20, 30]);

        setVertexAttributeArray(attribute, array);

        assert.equal(getVertexAttributeArray(attribute), array);
    });
});
