import { VertexFormat } from './vertex-format.ts';

const VERTEX_FORMAT_COMPONENT_COUNT_MAP = Object.freeze({
    [VertexFormat.FLOAT32X2]: 2,
    [VertexFormat.FLOAT32X3]: 3,
});

const VERTEX_FORMAT_TYPED_ARRAY_MAP = Object.freeze({
    [VertexFormat.FLOAT32X2]: Float32Array,
    [VertexFormat.FLOAT32X3]: Float32Array,
});

export {
    VERTEX_FORMAT_COMPONENT_COUNT_MAP,
    VERTEX_FORMAT_TYPED_ARRAY_MAP,
};
