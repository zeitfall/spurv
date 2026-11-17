import { VertexAttributeName } from '../geometry/index.ts';

import {
    getVertexAttributeShaderLocation,
    CAMERA_SHADER_CODE,
    MESHES_SHADER_CODE,
    type ShaderDescriptor,
} from '../shaders/index.ts';

import { Material } from './material.ts';

/**
 * A material that colors a surface by the direction of its normal.
 */
class NormalMaterial extends Material {
    /**
     * The shader that draws a surface with this material.
     */
    override get shader() {
        return NORMAL_MATERIAL_SHADER;
    }
}

const POSITION_LOCATION = getVertexAttributeShaderLocation(VertexAttributeName.POSITION);
const NORMAL_LOCATION = getVertexAttributeShaderLocation(VertexAttributeName.NORMAL);

const NORMAL_MATERIAL_SHADER_CODE = `
    ${CAMERA_SHADER_CODE}

    ${MESHES_SHADER_CODE}

    struct VertexStageInput {
        @builtin(instance_index)        instanceIndex : u32,
        @location(${POSITION_LOCATION}) position      : vec3f,
        @location(${NORMAL_LOCATION})   normal        : vec3f,
    }

    struct VertexStageOutput {
        @builtin(position) position    : vec4f,
        @location(0)       worldNormal : vec3f,
    }

    @vertex
    fn vertexStage(input : VertexStageInput) -> VertexStageOutput {
        var output : VertexStageOutput;

        let mesh            = meshes[input.instanceIndex];
        let meshWorldMatrix = mesh.worldMatrix;

        output.position    = camera.viewProjectionMatrix * meshWorldMatrix * vec4f(input.position, 1.0);
        output.worldNormal = (meshWorldMatrix * vec4f(input.normal, 0.0)).xyz;

        return output;
    }

    @fragment
    fn fragmentStage(input : VertexStageOutput) -> @location(0) vec4f {
        return vec4f(0.5 * normalize(input.worldNormal) + 0.5, 1.0);
    }
`;

const NORMAL_MATERIAL_SHADER: Readonly<ShaderDescriptor> = Object.freeze({
    code: NORMAL_MATERIAL_SHADER_CODE,
    vertexStageEntryPoint: 'vertexStage',
    fragmentStageEntryPoint: 'fragmentStage',
    requiredAttributeNames: Object.freeze([VertexAttributeName.POSITION, VertexAttributeName.NORMAL]),
});

export { NormalMaterial };
