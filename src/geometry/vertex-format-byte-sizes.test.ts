import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVertexFormatByteSize } from './vertex-format-byte-sizes.ts';
import { VertexFormat } from './vertex-format.ts';

describe('getVertexFormatByteSize()', () => {
    it('returns 8 for the format of two 32-bit floats', () => {
        assert.equal(getVertexFormatByteSize(VertexFormat.FLOAT32X2), 8);
    });

    it('returns 12 for the format of three 32-bit floats', () => {
        assert.equal(getVertexFormatByteSize(VertexFormat.FLOAT32X3), 12);
    });

    it('returns a positive integer for every vertex format', () => {
        for (const format of Object.values(VertexFormat)) {
            const byteSize = getVertexFormatByteSize(format);

            assert.ok(Number.isInteger(byteSize) && byteSize > 0);
        }
    });
});
