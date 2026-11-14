import { VertexFormat } from './vertex-format.ts';

const VERTEX_FORMAT_BYTE_SIZES = Object.freeze({
    [VertexFormat.FLOAT32X2]: 8,
    [VertexFormat.FLOAT32X3]: 12,
});

/**
 * Looks up the size of one vertex stored in the given vertex format.
 *
 * @param format - The vertex format.
 *
 * @remarks The size is in bytes.
 */
function getVertexFormatByteSize(format: VertexFormat) {
    return VERTEX_FORMAT_BYTE_SIZES[format];
}

export { getVertexFormatByteSize };
