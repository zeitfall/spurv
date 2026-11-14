import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVertexFormatTypedArray } from './vertex-format-typed-arrays.ts';
import { VertexFormat } from './vertex-format.ts';

describe('getVertexFormatTypedArray()', () => {
    it('returns Float32Array for the format of two 32-bit floats', () => {
        assert.equal(getVertexFormatTypedArray(VertexFormat.FLOAT32X2), Float32Array);
    });

    it('returns Float32Array for the format of three 32-bit floats', () => {
        assert.equal(getVertexFormatTypedArray(VertexFormat.FLOAT32X3), Float32Array);
    });

    it('returns a constructor for every vertex format', () => {
        for (const format of Object.values(VertexFormat)) {
            assert.equal(typeof getVertexFormatTypedArray(format), 'function');
        }
    });
});
