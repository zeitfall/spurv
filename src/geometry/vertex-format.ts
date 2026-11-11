/**
 * The formats in which a vertex attribute stores the components of one vertex.
 *
 * @remarks Each value is the string that WebGPU expects for the format.
 */
const VertexFormat = Object.freeze({
    FLOAT32X2: 'float32x2',
    FLOAT32X3: 'float32x3',
});

type VertexFormat = (typeof VertexFormat)[keyof typeof VertexFormat];

export { VertexFormat };
