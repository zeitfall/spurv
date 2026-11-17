import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VertexAttributeName } from '../geometry/index.ts';

import { getVertexAttributeShaderLocation } from './vertex-attribute-shader-locations.ts';

describe('getVertexAttributeShaderLocation()', () => {
    it('returns the locations 0, 1, and 2 for the position, the normal, and the UV', () => {
        assert.equal(getVertexAttributeShaderLocation(VertexAttributeName.POSITION), 0);
        assert.equal(getVertexAttributeShaderLocation(VertexAttributeName.NORMAL), 1);
        assert.equal(getVertexAttributeShaderLocation(VertexAttributeName.UV), 2);
    });

    it('returns a non-negative integer for every name of a vertex attribute', () => {
        for (const name of Object.values(VertexAttributeName)) {
            const location = getVertexAttributeShaderLocation(name);

            assert.ok(Number.isInteger(location) && location >= 0);
        }
    });

    it('returns each location for one name only', () => {
        const locations = Object.values(VertexAttributeName).map((name) => getVertexAttributeShaderLocation(name));

        assert.equal(new Set(locations).size, locations.length);
    });
});
