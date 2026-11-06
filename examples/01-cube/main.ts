import { degreesToRadians, clamp, Vector3, Quaternion, Matrix4 } from 'spurv';

const CAMERA_FIELD_OF_VIEW = degreesToRadians(60);
const CAMERA_NEAR_DISTANCE = 0.1;
const CAMERA_FAR_DISTANCE = 128;

const CUBE_ROTATION_SPEED = 0.5;

const DEPTH_TEXTURE_FORMAT = 'depth32float';

const gpu = navigator.gpu;
const gpuDevice = await initGPUDevice(gpu);
const gpuPreferredCanvasFormat = gpu.getPreferredCanvasFormat();

gpuDevice.addEventListener('uncapturederror', (event) => {
    console.error(event.error.message);
});

gpuDevice.lost.then((info) => {
    console.error(info.message);
});

const canvasElement = document.querySelector('canvas') as HTMLCanvasElement;
const canvasContext = canvasElement.getContext('webgpu') as GPUCanvasContext;

canvasContext.configure({
    device: gpuDevice,
    format: gpuPreferredCanvasFormat,
});

let depthStencilTexture = createDepthStencilTexture(canvasElement.width, canvasElement.height);

const canvasResizeObserver = new ResizeObserver((entries) => {
    const { devicePixelContentBoxSize } = entries[0];
    const { inlineSize, blockSize } = devicePixelContentBoxSize[0];
    const maxTextureSize = gpuDevice.limits.maxTextureDimension2D;

    canvasElement.width = clamp(inlineSize, 1, maxTextureSize);
    canvasElement.height = clamp(blockSize, 1, maxTextureSize);

    depthStencilTexture.destroy();
    depthStencilTexture = createDepthStencilTexture(canvasElement.width, canvasElement.height);
});

canvasResizeObserver.observe(canvasElement);

const cubeVertices = new Float32Array([
    0.5, 0.5, 0.5, 1, 0, 0, 0, 0,
    0.5, -0.5, 0.5, 1, 0, 0, 0, 1,
    0.5, -0.5, -0.5, 1, 0, 0, 1, 1,
    0.5, 0.5, -0.5, 1, 0, 0, 1, 0,

    -0.5, 0.5, -0.5, -1, 0, 0, 0, 0,
    -0.5, -0.5, -0.5, -1, 0, 0, 0, 1,
    -0.5, -0.5, 0.5, -1, 0, 0, 1, 1,
    -0.5, 0.5, 0.5, -1, 0, 0, 1, 0,

    -0.5, 0.5, -0.5, 0, 1, 0, 0, 0,
    -0.5, 0.5, 0.5, 0, 1, 0, 0, 1,
    0.5, 0.5, 0.5, 0, 1, 0, 1, 1,
    0.5, 0.5, -0.5, 0, 1, 0, 1, 0,

    -0.5, -0.5, 0.5, 0, -1, 0, 0, 0,
    -0.5, -0.5, -0.5, 0, -1, 0, 0, 1,
    0.5, -0.5, -0.5, 0, -1, 0, 1, 1,
    0.5, -0.5, 0.5, 0, -1, 0, 1, 0,

    -0.5, 0.5, 0.5, 0, 0, 1, 0, 0,
    -0.5, -0.5, 0.5, 0, 0, 1, 0, 1,
    0.5, -0.5, 0.5, 0, 0, 1, 1, 1,
    0.5, 0.5, 0.5, 0, 0, 1, 1, 0,

    0.5, 0.5, -0.5, 0, 0, -1, 0, 0,
    0.5, -0.5, -0.5, 0, 0, -1, 0, 1,
    -0.5, -0.5, -0.5, 0, 0, -1, 1, 1,
    -0.5, 0.5, -0.5, 0, 0, -1, 1, 0,
]);

const cubeVertexBuffer = gpuDevice.createBuffer({
    size: cubeVertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

gpuDevice.queue.writeBuffer(cubeVertexBuffer, 0, cubeVertices, 0);

const cubeIndices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
]);

const cubeIndexBuffer = gpuDevice.createBuffer({
    size: cubeIndices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
});

gpuDevice.queue.writeBuffer(cubeIndexBuffer, 0, cubeIndices, 0);

const cubeVertexLayout: GPUVertexBufferLayout = {
    arrayStride: 32,
    attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'float32x3' },
        { shaderLocation: 2, offset: 24, format: 'float32x2' },
    ],
};

const cubePosition = new Vector3(0, 0, 0);
const cubeRotationAxis = new Vector3(0, 1, -1).normalize();
const cubeRotation = new Quaternion();
const cubeScale = new Vector3(1, 1, 1);
const cubeModelMatrix = new Matrix4();

const cameraPosition = new Vector3(0, 0, 3);
const cameraRotation = new Quaternion();
const cameraScale = new Vector3(1, 1, 1);
const cameraViewMatrix = new Matrix4().compose(cameraPosition, cameraRotation, cameraScale).invert();
const cameraViewProjectionMatrix = new Matrix4();

const renderUniformArray = new Float32Array(32);

const renderUniformBuffer = gpuDevice.createBuffer({
    size: renderUniformArray.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const renderShaderModule = gpuDevice.createShaderModule({
    code: `
        struct Uniforms {
            model: mat4x4f,
            viewProjection: mat4x4f,
        }

        struct VertexStageInput {
            @location(0) position: vec3f,
            @location(1) normal: vec3f,
        }

        struct VertexStageOutput {
            @builtin(position) position: vec4f,
            @location(0) normal: vec3f,
        }

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        @vertex
        fn vertexStage(input: VertexStageInput) -> VertexStageOutput {
            var output: VertexStageOutput;

            output.position = uniforms.viewProjection * uniforms.model * vec4f(input.position, 1.0);
            output.normal = (uniforms.model * vec4f(input.normal, 0.0)).xyz;

            return output;
        }

        @fragment
        fn fragmentStage(@location(0) normal: vec3f) -> @location(0) vec4f {
            return vec4f(0.5 * normal + 0.5, 1.0);
        }
    `,
});

const renderBindGroupLayout = gpuDevice.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
        },
    ],
});

const renderPipelineLayout = gpuDevice.createPipelineLayout({
    bindGroupLayouts: [renderBindGroupLayout],
});

const renderPipeline = gpuDevice.createRenderPipeline({
    layout: renderPipelineLayout,
    vertex: {
        module: renderShaderModule,
        entryPoint: 'vertexStage',
        buffers: [cubeVertexLayout],
    },
    fragment: {
        module: renderShaderModule,
        entryPoint: 'fragmentStage',
        targets: [{ format: gpuPreferredCanvasFormat }],
    },
    primitive: {
        cullMode: 'back',
    },
    depthStencil: {
        format: DEPTH_TEXTURE_FORMAT,
        depthWriteEnabled: true,
        depthCompare: 'greater-equal',
    },
});

const renderBindGroup = gpuDevice.createBindGroup({
    layout: renderBindGroupLayout,
    entries: [
        {
            binding: 0,
            resource: renderUniformBuffer,
        },
    ],
});

const renderBundleEncoder = gpuDevice.createRenderBundleEncoder({
    colorFormats: [gpuPreferredCanvasFormat],
    depthStencilFormat: DEPTH_TEXTURE_FORMAT,
});

renderBundleEncoder.setPipeline(renderPipeline);
renderBundleEncoder.setBindGroup(0, renderBindGroup);
renderBundleEncoder.setVertexBuffer(0, cubeVertexBuffer);
renderBundleEncoder.setIndexBuffer(cubeIndexBuffer, 'uint16');
renderBundleEncoder.drawIndexed(cubeIndices.length);

const renderBundle = renderBundleEncoder.finish();

const renderColorAttachment: GPURenderPassColorAttachment = {
    // @ts-expect-error TS2322: Type 'undefined' is not assignable to type 'GPUTexture | GPUTextureView'.
    view: undefined,
    clearValue: [1, 1, 1, 1],
    loadOp: 'clear',
    storeOp: 'store',
};

const renderDepthStencilAttachment: GPURenderPassDepthStencilAttachment = {
    // @ts-expect-error TS2322: Type 'undefined' is not assignable to type 'GPUTexture | GPUTextureView'.
    view: undefined,
    depthClearValue: 0,
    depthLoadOp: 'clear',
    depthStoreOp: 'store',
};

const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [renderColorAttachment],
    depthStencilAttachment: renderDepthStencilAttachment,
};

requestAnimationFrame(renderFrame);

function renderFrame(elapsedTime: number) {
    const elapsedTimeInSeconds = elapsedTime / 1000;

    const canvasAspectRatio = canvasElement.width / canvasElement.height;

    cubeRotation.setFromAxisAngle(cubeRotationAxis, CUBE_ROTATION_SPEED * elapsedTimeInSeconds);
    cubeModelMatrix.compose(cubePosition, cubeRotation, cubeScale);
    cubeModelMatrix.writeToArray(renderUniformArray, 0);

    cameraViewProjectionMatrix
        .perspective(CAMERA_FIELD_OF_VIEW, canvasAspectRatio, CAMERA_NEAR_DISTANCE, CAMERA_FAR_DISTANCE)
        .multiply(cameraViewMatrix);
    cameraViewProjectionMatrix.writeToArray(renderUniformArray, 16);

    gpuDevice.queue.writeBuffer(renderUniformBuffer, 0, renderUniformArray);

    renderColorAttachment.view = canvasContext.getCurrentTexture().createView();
    renderDepthStencilAttachment.view = depthStencilTexture.createView();

    const commandEncoder = gpuDevice.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

    renderPass.executeBundles([renderBundle]);
    renderPass.end();

    gpuDevice.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(renderFrame);
}

async function initGPUDevice(gpu: GPU) {
    if (gpu === undefined) {
        throw new Error('initGPUDevice: expected navigator.gpu, received undefined.');
    }

    const adapter = await gpu.requestAdapter();

    if (adapter === null) {
        throw new Error('initGPUDevice: expected a GPU adapter, received null.');
    }

    return adapter.requestDevice();
}

function createDepthStencilTexture(width: number, height: number) {
    return gpuDevice.createTexture({
        size: [width, height],
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        format: DEPTH_TEXTURE_FORMAT,
    });
    }
