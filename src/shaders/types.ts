import type { VertexAttributeName } from '../geometry/index.ts';

/**
 * A description of a shader from which the renderer creates its GPU objects.
 */
interface ShaderDescriptor {
    /**
     * The WGSL code of the shader.
     */
    code: string;

    /**
     * The name of the function in the code that runs the vertex stage.
     */
    vertexStageEntryPoint: string;

    /**
     * The name of the function in the code that runs the fragment stage.
     */
    fragmentStageEntryPoint: string;

    /**
     * The names of the vertex attributes that the shader requires of a geometry.
     */
    requiredAttributeNames: ReadonlyArray<VertexAttributeName>;
}

export type { ShaderDescriptor };
