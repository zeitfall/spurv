import { setVertexAttributeArray } from './vertex-attribute-arrays.ts';
import { getVertexFormatComponentCount } from './vertex-format-component-counts.ts';
import { getVertexFormatTypedArray } from './vertex-format-typed-arrays.ts';
import { VertexFormat } from './vertex-format.ts';

import type { VertexAttributeArray } from './types.ts';

const VERTEX_FORMATS = Object.freeze(Object.values(VertexFormat));

/**
 * The components of one attribute for every vertex of a geometry, stored in a vertex format.
 */
class VertexAttribute {
    #array: VertexAttributeArray;
    #format: VertexFormat;

    #version: number;

    /**
     * Creates a vertex attribute with the given components and format.
     *
     * @param array - The components of all vertices, vertex by vertex.
     * @param format - The format of one vertex.
     *
     * @throws RangeError if the given format is not a vertex format, or if the length of the given array is zero
     * or is not a multiple of the number of components of the format.
     *
     * @remarks The given array is copied, so a later change to it does not affect this attribute.
     */
    constructor(array: ArrayLike<number>, format: VertexFormat) {
        if (VERTEX_FORMATS.includes(format) === false) {
            throw new RangeError(`VertexAttribute.constructor: expected a vertex format, received ${format}.`);
        }

        this.#array = getVertexFormatTypedArray(format).from(array);
        this.#format = format;

        if (array.length === 0 || array.length % this.#componentCountPerFormat !== 0) {
            throw new RangeError(`VertexAttribute.constructor: expected an array whose length is a positive multiple of ${this.#componentCountPerFormat}, received an array of length ${array.length}.`);
        }

        this.#version = 0;

        setVertexAttributeArray(this, this.#array);
    }

    /**
     * The format of one vertex of this attribute.
     */
    get format() {
        return this.#format;
    }

    /**
     * The counter that increases each time components of this attribute are assigned.
     *
     * @remarks Two readings that differ indicate an assignment, so the components need not be compared.
     */
    get version() {
        return this.#version;
    }

    /**
     * The number of vertices of this attribute.
     */
    get vertexCount() {
        return this.#array.length / this.#componentCountPerFormat;
    }

    get #componentCountPerFormat() {
        return getVertexFormatComponentCount(this.#format);
    }

    // Assignment -------------------------------------------------------------

    /**
     * Sets this attribute to the components read from the given array.
     *
     * @param array - The source array.
     * @param arrayOffset - The index of the first component in the given array.
     *
     * @remarks A component whose element is absent from the array is left unchanged.
     */
    setFromArray(array: ArrayLike<number>, arrayOffset = 0) {
        const attributeArrayLength = this.#array.length;

        for (let i = 0; i < attributeArrayLength; i++) {
            this.#array[i] = array[arrayOffset + i] ?? this.#array[i];
        }

        this.#version++;

        return this;
    }

    /**
     * Sets the vertex of this attribute at the given index to the components read from the given array.
     *
     * @param vertexIndex - The index of the vertex.
     * @param array - The source array.
     * @param arrayOffset - The index of the first component in the given array.
     *
     * @remarks A component whose element is absent from the array is left unchanged.
     * @remarks An index of a vertex outside this attribute changes no component.
     */
    setVertexFromArray(vertexIndex: number, array: ArrayLike<number>, arrayOffset = 0) {
        const componentCountPerFormat = this.#componentCountPerFormat;
        const vertexIndexInArray = vertexIndex * componentCountPerFormat;

        for (let i = 0; i < componentCountPerFormat; i++) {
            this.#array[vertexIndexInArray + i] = array[arrayOffset + i] ?? this.#array[vertexIndexInArray + i];
        }

        this.#version++;

        return this;
    }

    // Conversion -------------------------------------------------------------

    /**
     * Writes the components of all vertices of this attribute into the given array.
     *
     * @param array - The destination array.
     * @param arrayOffset - The index of the first component in the given array.
     *
     * @returns The given array.
     */
    writeToArray(array: ArrayLike<number>, arrayOffset = 0) {
        const attributeArrayLength = this.#array.length;

        for (let i = 0; i < attributeArrayLength; i++) {
            // @ts-expect-error TS2542: ArrayLike<number> is read-only.
            array[arrayOffset + i] = this.#array[i];
        }

        return array;
    }

    /**
     * Writes the components of the vertex of this attribute at the given index into the given array.
     *
     * @param vertexIndex - The index of the vertex.
     * @param array - The destination array.
     * @param arrayOffset - The index of the first component in the given array.
     *
     * @returns The given array.
     *
     * @remarks An index of a vertex outside this attribute writes undefined elements.
     */
    writeVertexToArray(vertexIndex: number, array: ArrayLike<number>, arrayOffset = 0) {
        const componentCountPerFormat = this.#componentCountPerFormat;
        const vertexIndexInArray = vertexIndex * componentCountPerFormat;

        for (let i = 0; i < componentCountPerFormat; i++) {
            // @ts-expect-error TS2542: ArrayLike<number> is read-only.
            array[arrayOffset + i] = this.#array[vertexIndexInArray + i];
        }

        return array;
    }
}

export { VertexAttribute };
