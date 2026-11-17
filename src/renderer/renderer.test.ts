import assert from 'node:assert/strict';

import {
    after,
    afterEach,
    before,
    describe,
    it,
} from 'node:test';

import { RenderDevice } from '../gpu/index.ts';

import { Scene, SceneNode } from '../scene/index.ts';

import { Camera, PerspectiveProjection } from '../cameras/index.ts';

import {
    Geometry,
    VertexAttribute,
    VertexAttributeName,
    VertexFormat,
} from '../geometry/index.ts';

import { NormalMaterial, type Material } from '../materials/index.ts';

import { Mesh } from '../meshes/index.ts';

import { Renderer } from './renderer.ts';

interface FakeTexture {
    width: number;
    height: number;
    depthOrArrayLayers: number;
    dimension: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: number;
    sampleCount: number;
    mipLevelCount: number;
    destroyCount: number;
    createView(): object;
    destroy(): void;
}

interface FakeBuffer {
    size: number;
    usage: number;
    destroyCount: number;
    getMappedRange(): ArrayBuffer;
    unmap(): void;
    destroy(): void;
}

interface FakePassCall {
    method: string;
    arguments: unknown[];
}

interface FakeCanvas {
    width: number;
    height: number;
}

const PREFERRED_CANVAS_FORMAT = 'rgba8unorm';
const MAX_TEXTURE_DIMENSION = 8192;

const BUFFER_USAGE = Object.freeze({ COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128 });

function settle() {
    return new Promise((resolve) => {
        setImmediate(resolve);
    });
}

function stubNavigatorGPU(gpu: object) {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: gpu });
}

function textureAt(textures: FakeTexture[], index: number) {
    const texture = textures[index];

    assert.ok(texture);

    return texture;
}

function createFakeDevice() {
    const textures: FakeTexture[] = [];
    const buffers: FakeBuffer[] = [];
    const renderPipelines: object[] = [];
    const renderPassDescriptors: GPURenderPassDescriptor[] = [];
    const passCalls: FakePassCall[] = [];
    const submissions: object[][] = [];
    const destructions: object[] = [];

    let resolveLost: (info: GPUDeviceLostInfo) => void = () => {};

    const lost = new Promise<GPUDeviceLostInfo>((resolve) => {
        resolveLost = resolve;
    });

    function createTexture(descriptor: GPUTextureDescriptor) {
        const [width = 0, height = 1, depthOrArrayLayers = 1] = descriptor.size as number[];
        const view = {};

        const texture: FakeTexture = {
            width,
            height,
            depthOrArrayLayers,
            dimension: descriptor.dimension ?? '2d',
            format: descriptor.format,
            usage: descriptor.usage,
            sampleCount: descriptor.sampleCount ?? 1,
            mipLevelCount: descriptor.mipLevelCount ?? 1,
            destroyCount: 0,
            createView() {
                return view;
            },
            destroy() {
                texture.destroyCount++;
            },
        };

        textures.push(texture);

        return texture;
    }

    function createBuffer(descriptor: GPUBufferDescriptor) {
        const mappedRange = new ArrayBuffer(descriptor.size);

        const buffer: FakeBuffer = {
            size: descriptor.size,
            usage: descriptor.usage,
            destroyCount: 0,
            getMappedRange: () => mappedRange,
            unmap: () => {},
            destroy() {
                buffer.destroyCount++;
            },
        };

        buffers.push(buffer);

        return buffer;
    }

    function createShaderModule() {
        return { getCompilationInfo: async () => ({ messages: [] }) };
    }

    function createRenderPipeline() {
        const renderPipeline = {};

        renderPipelines.push(renderPipeline);

        return renderPipeline;
    }

    function recordPassCall(method: string) {
        return (...callArguments: unknown[]) => {
            passCalls.push({ method, arguments: callArguments });
        };
    }

    function beginRenderPass(descriptor: GPURenderPassDescriptor) {
        renderPassDescriptors.push(descriptor);

        return {
            setBindGroup: recordPassCall('setBindGroup'),
            setPipeline: recordPassCall('setPipeline'),
            setVertexBuffer: recordPassCall('setVertexBuffer'),
            setIndexBuffer: recordPassCall('setIndexBuffer'),
            draw: recordPassCall('draw'),
            drawIndexed: recordPassCall('drawIndexed'),
            end: recordPassCall('end'),
        };
    }

    function createCommandEncoder() {
        return { beginRenderPass, finish: () => ({}) };
    }

    function submit(commandBuffers: object[]) {
        submissions.push(commandBuffers);
    }

    const gpuDevice = {
        limits: { maxTextureDimension2D: MAX_TEXTURE_DIMENSION },
        lost,
        queue: { writeBuffer: () => {}, submit },
        addEventListener: () => {},
        createTexture,
        createBuffer,
        createShaderModule,
        createBindGroupLayout: () => ({}),
        createBindGroup: () => ({}),
        createPipelineLayout: () => ({}),
        createRenderPipeline,
        createCommandEncoder,
        destroy: () => {
            destructions.push(gpuDevice);
        },
    } as unknown as GPUDevice;

    function loseDevice(reason: string) {
        resolveLost({ reason, message: 'lost' } as GPUDeviceLostInfo);
    }

    return {
        gpuDevice,
        textures,
        buffers,
        renderPipelines,
        renderPassDescriptors,
        passCalls,
        submissions,
        destructions,
        loseDevice,
    };
}

function createSubject(canvasWidth = 800, canvasHeight = 600) {
    const fakeDevice = createFakeDevice();
    const canvas: FakeCanvas = { width: canvasWidth, height: canvasHeight };
    const canvasView = {};

    const canvasContext = {
        canvas,
        getCurrentTexture: () => ({ createView: () => canvasView }),
    } as unknown as GPUCanvasContext;

    const renderer = new Renderer(new RenderDevice(fakeDevice.gpuDevice, PREFERRED_CANVAS_FORMAT), canvasContext);

    return {
        renderer,
        canvas,
        canvasView,
        ...fakeDevice,
    };
}

function createCamera() {
    const camera = new Camera(new PerspectiveProjection(1, 0.1, 100));
    const cameraNode = new SceneNode();

    cameraNode.addComponent(camera);

    return camera;
}

function createTriangleGeometry() {
    return new Geometry()
        .setAttribute(
            VertexAttributeName.POSITION,
            new VertexAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], VertexFormat.FLOAT32X3),
        )
        .setAttribute(
            VertexAttributeName.NORMAL,
            new VertexAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X3),
        )
        .setIndices(new Uint16Array([0, 1, 2, 2, 1, 0]));
}

function createFlatGeometry() {
    return new Geometry()
        .setAttribute(
            VertexAttributeName.POSITION,
            new VertexAttribute([0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X2),
        )
        .setAttribute(
            VertexAttributeName.NORMAL,
            new VertexAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X3),
        );
}

function appendMesh(scene: Scene, geometry: Geometry, material: Material) {
    const node = new SceneNode();

    node.addComponent(new Mesh(geometry, material));
    scene.root.addChild(node);
}

function findLiveBuffersWithUsage(buffers: FakeBuffer[], usage: number) {
    return buffers.filter((buffer) => (buffer.usage & usage) !== 0 && buffer.destroyCount === 0);
}

function findPassCallArguments(passCalls: FakePassCall[], method: string) {
    return passCalls.filter((passCall) => passCall.method === method).map((passCall) => passCall.arguments);
}

describe('Renderer', () => {
    before(() => {
        Object.assign(globalThis, {
            GPUBufferUsage: BUFFER_USAGE,
            GPUShaderStage: { VERTEX: 1, FRAGMENT: 2 },
            GPUTextureUsage: { TEXTURE_BINDING: 4, RENDER_ATTACHMENT: 16 },
        });
    });

    after(() => {
        Reflect.deleteProperty(globalThis, 'GPUBufferUsage');
        Reflect.deleteProperty(globalThis, 'GPUShaderStage');
        Reflect.deleteProperty(globalThis, 'GPUTextureUsage');
    });

    describe('create()', () => {
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'gpu');
        });

        it('creates a renderer whose canvas context uses the preferred format', async () => {
            const { gpuDevice } = createFakeDevice();
            const configurations: unknown[] = [];
            const canvas = { width: 800, height: 600, getContext: () => context };
            const context = {
                canvas,
                configure: (configuration: unknown) => {
                    configurations.push(configuration);
                },
            };

            stubNavigatorGPU({
                getPreferredCanvasFormat: () => PREFERRED_CANVAS_FORMAT,
                requestAdapter: async () => ({ requestDevice: async () => gpuDevice }),
            });

            const renderer = await Renderer.create(canvas as unknown as HTMLCanvasElement);

            assert.ok(renderer instanceof Renderer);
            assert.deepEqual(configurations, [{ format: PREFERRED_CANVAS_FORMAT, device: gpuDevice }]);
        });

        it('rejects in an environment without WebGPU', async () => {
            const canvas = { width: 800, height: 600, getContext: () => null };

            await assert.rejects(() => Renderer.create(canvas as unknown as HTMLCanvasElement), {
                name: 'Error',
                message: /^RenderDevice\.create: /,
            });
        });

        it('rejects for a canvas that provides no WebGPU context', async () => {
            const { gpuDevice } = createFakeDevice();
            const canvas = { width: 800, height: 600, getContext: () => null };

            stubNavigatorGPU({
                getPreferredCanvasFormat: () => PREFERRED_CANVAS_FORMAT,
                requestAdapter: async () => ({ requestDevice: async () => gpuDevice }),
            });

            await assert.rejects(() => Renderer.create(canvas as unknown as HTMLCanvasElement), {
                name: 'Error',
                message: /^RenderDevice\.createCanvasContext: /,
            });
        });
    });

    describe('constructor()', () => {
        it('creates a depth texture of the size of the canvas', () => {
            const { textures } = createSubject(800, 600);

            assert.equal(textures.length, 1);
            assert.equal(textureAt(textures, 0).width, 800);
            assert.equal(textureAt(textures, 0).height, 600);
        });

        it('creates a depth texture of one texel for a canvas without area', () => {
            const { textures } = createSubject(0, 0);

            assert.equal(textureAt(textures, 0).width, 1);
            assert.equal(textureAt(textures, 0).height, 1);
        });
    });

    describe('maxCanvasSizePerDimension', () => {
        it('exposes the largest texture dimension of the device', () => {
            const { renderer } = createSubject();

            assert.equal(renderer.maxCanvasSizePerDimension, MAX_TEXTURE_DIMENSION);
        });

        it('throws on assignment', () => {
            const { renderer } = createSubject();

            assert.throws(() => Object.assign(renderer, { maxCanvasSizePerDimension: 1 }), TypeError);
        });
    });

    describe('addEventListener()', () => {
        it('reports an unexpected loss of the device', async () => {
            const { renderer, loseDevice } = createSubject();
            const reasons: string[] = [];

            renderer.addEventListener('devicelost', (event) => {
                reasons.push(event.detail.reason);
            });

            loseDevice('unknown');
            await settle();

            assert.deepEqual(reasons, ['unknown']);
        });
    });

    describe('removeEventListener()', () => {
        it('stops the delivery of events to the listener', async () => {
            const { renderer, loseDevice } = createSubject();
            const reasons: string[] = [];

            function listener(event: CustomEvent<GPUDeviceLostInfo>) {
                reasons.push(event.detail.reason);
            }

            renderer.addEventListener('devicelost', listener);
            renderer.removeEventListener('devicelost', listener);

            loseDevice('unknown');
            await settle();

            assert.deepEqual(reasons, []);
        });
    });

    describe('render()', () => {
        it('submits one pass that clears the color of the canvas and clears the depth to 0', () => {
            const { renderer, canvasView, textures, renderPassDescriptors, passCalls, submissions } = createSubject();

            renderer.render(new Scene(), createCamera());

            const renderPassDescriptor = renderPassDescriptors[0];

            assert.ok(renderPassDescriptor);

            const colorAttachment = Array.from(renderPassDescriptor.colorAttachments)[0];
            const depthStencilAttachment = renderPassDescriptor.depthStencilAttachment;

            assert.ok(colorAttachment);
            assert.ok(depthStencilAttachment);

            assert.equal(colorAttachment.view, canvasView);
            assert.equal(colorAttachment.loadOp, 'clear');
            assert.equal(colorAttachment.storeOp, 'store');
            assert.deepEqual(colorAttachment.clearValue, [1, 1, 1, 1]);

            assert.equal(depthStencilAttachment.view, textureAt(textures, 0).createView());
            assert.equal(depthStencilAttachment.depthLoadOp, 'clear');
            assert.equal(depthStencilAttachment.depthClearValue, 0);

            assert.equal(findPassCallArguments(passCalls, 'end').length, 1);
            assert.equal(renderPassDescriptors.length, 1);
            assert.equal(submissions.length, 1);
        });

        it('keeps the depth texture while the size of the canvas is unchanged', () => {
            const { renderer, textures } = createSubject();

            renderer.render(new Scene(), createCamera());
            renderer.render(new Scene(), createCamera());

            assert.equal(textures.length, 1);
            assert.equal(textureAt(textures, 0).destroyCount, 0);
        });

        it('renders into a new depth texture after a change of the size of the canvas', () => {
            const { renderer, canvas, textures, renderPassDescriptors } = createSubject(800, 600);

            canvas.width = 1024;
            canvas.height = 768;
            renderer.render(new Scene(), createCamera());

            const depthStencilAttachment = renderPassDescriptors[0]?.depthStencilAttachment;

            assert.equal(textures.length, 2);
            assert.equal(textureAt(textures, 0).destroyCount, 1);
            assert.equal(textureAt(textures, 1).width, 1024);
            assert.equal(textureAt(textures, 1).height, 768);
            assert.ok(depthStencilAttachment);
            assert.equal(depthStencilAttachment.view, textureAt(textures, 1).createView());
        });

        it('leaves the canvas and the depth texture unchanged for a canvas without area', () => {
            const { renderer, canvas, textures, submissions } = createSubject(800, 600);

            canvas.width = 0;
            renderer.render(new Scene(), createCamera());

            assert.equal(textures.length, 1);
            assert.equal(textureAt(textures, 0).destroyCount, 0);
            assert.equal(submissions.length, 0);
        });

        it('returns without any work after a loss of the device', async () => {
            const { renderer, canvas, textures, submissions, loseDevice } = createSubject(800, 600);

            loseDevice('unknown');
            await settle();

            canvas.width = 1024;
            renderer.render(new Scene(), createCamera());

            assert.equal(textures.length, 1);
            assert.equal(submissions.length, 0);
        });

        it('throws after destroy()', () => {
            const { renderer } = createSubject();

            renderer.destroy();

            assert.throws(() => renderer.render(new Scene(), createCamera()), {
                name: 'Error',
                message: /^Renderer\.render: expected an active renderer, /,
            });
        });

        it('throws for a geometry that lacks an attribute that the shader requires', () => {
            const { renderer } = createSubject();
            const scene = new Scene();
            const geometry = new Geometry().setAttribute(
                VertexAttributeName.POSITION,
                new VertexAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], VertexFormat.FLOAT32X3),
            );

            appendMesh(scene, geometry, new NormalMaterial());

            assert.throws(() => renderer.render(scene, createCamera()), {
                name: 'Error',
                message: /^Renderer\.render: expected a geometry with the attribute NORMAL, /,
            });
        });

        it('draws each mesh of the scene, with the meshes of one pipeline together', () => {
            const { renderer, renderPipelines, passCalls } = createSubject();
            const scene = new Scene();

            appendMesh(scene, createTriangleGeometry(), new NormalMaterial());
            appendMesh(scene, createFlatGeometry(), new NormalMaterial());
            appendMesh(scene, createTriangleGeometry(), new NormalMaterial());
            renderer.render(scene, createCamera());

            const drawCalls = passCalls.filter((passCall) => passCall.method.startsWith('draw'));

            assert.deepEqual(findPassCallArguments(passCalls, 'setPipeline'), [
                [renderPipelines[0]],
                [renderPipelines[1]],
            ]);

            assert.deepEqual(drawCalls, [
                { method: 'drawIndexed', arguments: [6, 1, 0, 0, 0] },
                { method: 'drawIndexed', arguments: [6, 1, 0, 0, 2] },
                { method: 'draw', arguments: [3, 1, 0, 1] },
            ]);
        });

        it('draws every mesh of a shared geometry and sets its index buffer once', () => {
            const { renderer, buffers, passCalls } = createSubject();
            const geometry = createTriangleGeometry();
            const scene = new Scene();

            appendMesh(scene, geometry, new NormalMaterial());
            appendMesh(scene, geometry, new NormalMaterial());
            renderer.render(scene, createCamera());

            const indexBuffers = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            assert.equal(indexBuffers.length, 1);

            assert.deepEqual(findPassCallArguments(passCalls, 'setIndexBuffer'), [[indexBuffers[0], 'uint16']]);
            assert.deepEqual(findPassCallArguments(passCalls, 'drawIndexed'), [
                [6, 1, 0, 0, 0],
                [6, 1, 0, 0, 1],
            ]);
        });
    });

    describe('destroy()', () => {
        it('destroys the device', () => {
            const { renderer, destructions } = createSubject();

            renderer.destroy();

            assert.equal(destructions.length, 1);
        });
    });
});
