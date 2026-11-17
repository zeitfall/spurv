import type { ShaderDescriptor } from '../shaders/index.ts';

/**
 * A description of the appearance of a surface.
 */
abstract class Material {
    /**
     * The shader that draws a surface with this material.
     */
    abstract get shader(): Readonly<ShaderDescriptor>;
}

export { Material };
