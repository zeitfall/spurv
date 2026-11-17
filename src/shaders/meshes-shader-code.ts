const MESHES_SHADER_CODE = `
    struct Mesh {
        worldMatrix : mat4x4f,
    }

    @group(1) @binding(0) var<storage, read> meshes : array<Mesh>;
`;

export { MESHES_SHADER_CODE };
