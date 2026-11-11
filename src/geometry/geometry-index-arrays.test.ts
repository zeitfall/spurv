import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getGeometryIndexArray, setGeometryIndexArray, deleteGeometryIndexArray } from './geometry-index-arrays.ts';
import { Geometry } from './geometry.ts';

describe('getGeometryIndexArray()', () => {
    it('returns null for a geometry without indices', () => {
        const geometry = new Geometry();

        assert.equal(getGeometryIndexArray(geometry), null);
    });

    it('returns the same array on every call', () => {
        const geometry = new Geometry();

        geometry.setIndices(new Uint16Array([0, 1, 2]));

        assert.equal(getGeometryIndexArray(geometry), getGeometryIndexArray(geometry));
    });

    it('returns a separate array for each geometry', () => {
        const geometryA = new Geometry();
        const geometryB = new Geometry();
        const indices = new Uint16Array([0, 1, 2]);

        geometryA.setIndices(indices);
        geometryB.setIndices(indices);

        assert.notEqual(getGeometryIndexArray(geometryA), getGeometryIndexArray(geometryB));
    });
});

describe('setGeometryIndexArray()', () => {
    it('records the given array for the given geometry', () => {
        const geometry = new Geometry();
        const array = new Uint32Array([0, 1, 2]);

        setGeometryIndexArray(geometry, array);

        assert.equal(getGeometryIndexArray(geometry), array);
    });
});

describe('deleteGeometryIndexArray()', () => {
    it('removes the array of the given geometry', () => {
        const geometry = new Geometry();

        setGeometryIndexArray(geometry, new Uint32Array([0, 1, 2]));
        deleteGeometryIndexArray(geometry);

        assert.equal(getGeometryIndexArray(geometry), null);
    });

    it('leaves a geometry without an array unchanged', () => {
        const geometry = new Geometry();

        deleteGeometryIndexArray(geometry);

        assert.equal(getGeometryIndexArray(geometry), null);
    });
});
