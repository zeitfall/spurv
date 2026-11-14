import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getVertexFormatComponentCount } from './vertex-format-component-counts.ts';
import { VertexFormat } from './vertex-format.ts';

describe('getVertexFormatComponentCount()', () => {
    it('returns 2 for the format of two 32-bit floats', () => {
        assert.equal(getVertexFormatComponentCount(VertexFormat.FLOAT32X2), 2);
    });

    it('returns 3 for the format of three 32-bit floats', () => {
        assert.equal(getVertexFormatComponentCount(VertexFormat.FLOAT32X3), 3);
    });

    it('returns a positive integer for every vertex format', () => {
        for (const format of Object.values(VertexFormat)) {
            const componentCount = getVertexFormatComponentCount(format);

            assert.ok(Number.isInteger(componentCount) && componentCount > 0);
        }
    });
});
