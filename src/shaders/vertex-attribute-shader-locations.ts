import { VertexAttributeName } from '../geometry/index.ts';

const VERTEX_ATTRIBUTE_SHADER_LOCATIONS = Object.freeze({
    [VertexAttributeName.POSITION]: 0,
    [VertexAttributeName.NORMAL]: 1,
    [VertexAttributeName.UV]: 2,
});

/**
 * Looks up the shader location of the vertex attribute with the given name.
 *
 * @param name - The name of the vertex attribute.
 *
 * @remarks The location is the same in every shader.
 */
function getVertexAttributeShaderLocation(name: VertexAttributeName) {
    return VERTEX_ATTRIBUTE_SHADER_LOCATIONS[name];
}

export { getVertexAttributeShaderLocation };
