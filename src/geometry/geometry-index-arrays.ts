import type { Geometry } from './geometry.ts';

const geometryIndexArrays = new WeakMap<Geometry, Uint16Array | Uint32Array>();

/**
 * Looks up the array that holds the indices of the given geometry.
 *
 * @param geometry - The geometry.
 *
 * @returns The array, or null if the geometry has no indices.
 *
 * @remarks The array is the storage of the geometry and not a copy, so a change to it bypasses the version of
 * the geometry.
 */
function getGeometryIndexArray(geometry: Geometry) {
    return geometryIndexArrays.get(geometry) ?? null;
}

function setGeometryIndexArray(geometry: Geometry, array: Uint16Array | Uint32Array) {
    geometryIndexArrays.set(geometry, array);
}

function deleteGeometryIndexArray(geometry: Geometry) {
    geometryIndexArrays.delete(geometry);
}

export { getGeometryIndexArray, setGeometryIndexArray, deleteGeometryIndexArray };
