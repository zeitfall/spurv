import { VertexFormat } from './vertex-format.ts';

const VERTEX_FORMAT_TYPED_ARRAYS = Object.freeze({
    [VertexFormat.FLOAT32X2]: Float32Array,
    [VertexFormat.FLOAT32X3]: Float32Array,
});

function getVertexFormatTypedArray(format: VertexFormat) {
    return VERTEX_FORMAT_TYPED_ARRAYS[format];
}

export { getVertexFormatTypedArray };
