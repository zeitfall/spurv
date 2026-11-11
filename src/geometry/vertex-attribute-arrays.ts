import type { VertexAttributeArray } from './types.ts';
import type { VertexAttribute } from './vertex-attribute.ts';

const vertexAttributeArrays = new WeakMap<VertexAttribute, VertexAttributeArray>();

/**
 * Looks up the array that holds the components of the given vertex attribute.
 *
 * @param attribute - The vertex attribute.
 *
 * @remarks The array is the storage of the attribute and not a copy, so a change to it bypasses the version of
 * the attribute.
 */
function getVertexAttributeArray(attribute: VertexAttribute) {
    return vertexAttributeArrays.get(attribute) as VertexAttributeArray;
}

function setVertexAttributeArray(attribute: VertexAttribute, array: VertexAttributeArray) {
    vertexAttributeArrays.set(attribute, array);
}

export { getVertexAttributeArray, setVertexAttributeArray };
