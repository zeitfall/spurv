import { setGeometryIndexArray, deleteGeometryIndexArray } from './geometry-index-arrays.ts';
import { VertexAttributeName } from './vertex-attribute-name.ts';

import type { VertexAttribute } from './vertex-attribute.ts';

const VERTEX_ATTRIBUTE_NAMES = Object.freeze(Object.values(VertexAttributeName));

/**
 * A shape described by named vertex attributes and by optional indices of the vertices of its triangles.
 */
class Geometry {
    #attributes: Map<VertexAttributeName, VertexAttribute>;
    #indices: Uint16Array | Uint32Array | null;

    #vertexCount: number;

    #version: number;

    /**
     * Creates a geometry without attributes and without indices.
     */
    constructor() {
        this.#attributes = new Map();
        this.#indices = null;

        this.#vertexCount = 0;

        this.#version = 0;
    }

    /**
     * The number of vertices of the attributes of this geometry, or zero if it holds no attributes.
     */
    get vertexCount() {
        return this.#vertexCount;
    }

    /**
     * The number of indices of this geometry, or zero if it has no indices.
     */
    get indexCount() {
        if (this.#indices === null) {
            return 0;
        }

        return this.#indices.length;
    }

    /**
     * The counter that increases each time an attribute or the indices of this geometry are assigned.
     *
     * @remarks An assignment of the components of an attribute increases the version of that attribute and
     * leaves this counter unchanged.
     */
    get version() {
        return this.#version;
    }

    // Attributes -------------------------------------------------------------

    /**
     * Sets the attribute of this geometry under the given name to the given attribute.
     *
     * @param name - The name of the attribute.
     * @param attribute - The attribute to hold under the name.
     *
     * @throws RangeError if the given name is not a vertex attribute name, or if the vertex count of the given
     * attribute differs from that of an attribute under another name.
     *
     * @remarks An attribute that this geometry already holds under the given name is replaced.
     */
    setAttribute(name: VertexAttributeName, attribute: VertexAttribute) {
        if (VERTEX_ATTRIBUTE_NAMES.includes(name) === false) {
            throw new RangeError(`Geometry.setAttribute: expected a vertex attribute name, received ${name}.`);
        }

        const attributeVertexCount = attribute.vertexCount;

        let otherAttributeCount = this.#attributes.size;

        if (this.#attributes.has(name)) {
            otherAttributeCount--;
        }

        if (otherAttributeCount === 0) {
            this.#vertexCount = attributeVertexCount;
        }
        else if (attributeVertexCount !== this.#vertexCount) {
            throw new RangeError(`Geometry.setAttribute: expected an attribute of ${this.#vertexCount} vertices, received an attribute of ${attributeVertexCount} vertices.`);
        }

        this.#attributes.set(name, attribute);

        this.#version++;

        return this;
    }

    /**
     * Looks up the attribute of this geometry under the given name.
     *
     * @param name - The name to look up.
     *
     * @returns The attribute, or null if this geometry holds no attribute under the given name.
     */
    getAttribute(name: VertexAttributeName) {
        return this.#attributes.get(name) ?? null;
    }

    // Indices ----------------------------------------------------------------

    /**
     * Sets this geometry to the given indices.
     *
     * @param indices - The indices of the vertices of each triangle, or null for a geometry without indices.
     *
     * @throws TypeError if the given value is neither a `Uint16Array`, nor a `Uint32Array`, nor null.
     * @throws RangeError if the length of the given array is zero or is not a multiple of 3.
     *
     * @remarks The given array is copied, so a later change to it does not affect this geometry.
     */
    setIndices(indices: Uint16Array | Uint32Array | null) {
        if (indices === null) {
            this.#indices = null;
            deleteGeometryIndexArray(this);

            this.#version++;

            return this;
        }

        const indicesAreTyped = indices instanceof Uint16Array || indices instanceof Uint32Array;

        if (indicesAreTyped === false) {
            throw new TypeError('Geometry.setIndices: expected a Uint16Array, a Uint32Array, or null, received another value.');
        }

        if (indices.length === 0 || indices.length % 3 !== 0) {
            throw new RangeError(`Geometry.setIndices: expected an array whose length is a positive multiple of 3, received an array of length ${indices.length}.`);
        }

        this.#indices = indices.slice();
        setGeometryIndexArray(this, this.#indices);

        this.#version++;

        return this;
    }

    /**
     * Writes the indices of this geometry into the given array.
     *
     * @param array - The destination array.
     * @param arrayOffset - The index of the first index in the given array.
     *
     * @returns The given array.
     *
     * @remarks A geometry without indices writes nothing.
     */
    writeIndicesToArray(array: ArrayLike<number>, arrayOffset = 0) {
        if (this.#indices === null) {
            return array;
        }

        const indexArrayLength = this.#indices.length;

        for (let i = 0; i < indexArrayLength; i++) {
            // @ts-expect-error TS2542: ArrayLike<number> is read-only.
            array[arrayOffset + i] = this.#indices[i];
        }

        return array;
    }
}

export { Geometry };
