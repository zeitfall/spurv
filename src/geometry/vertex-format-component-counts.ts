import { VertexFormat } from './vertex-format.ts';

const VERTEX_FORMAT_COMPONENT_COUNTS = Object.freeze({
    [VertexFormat.FLOAT32X2]: 2,
    [VertexFormat.FLOAT32X3]: 3,
});

function getVertexFormatComponentCount(format: VertexFormat) {
    return VERTEX_FORMAT_COMPONENT_COUNTS[format];
}

export { getVertexFormatComponentCount };
