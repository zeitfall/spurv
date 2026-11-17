const CAMERA_SHADER_CODE = `
    struct Camera {
        viewProjectionMatrix : mat4x4f,
    }

    @group(0) @binding(0) var<uniform> camera : Camera;
`;

export { CAMERA_SHADER_CODE };
