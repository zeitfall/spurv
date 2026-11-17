import assert from 'node:assert/strict';

import {
    after,
    before,
    describe,
    it,
} from 'node:test';

import { RenderDevice } from '../gpu/index.ts';

import { RendererRenderPhase } from './renderer-render-phase.ts';

import type { RenderFrameResources, RenderFrameDrawList } from './types.ts';

interface FakeTexture {
    width: number;
    height: number;
    destroyCount: number;
}

interface FakeRenderPass {
    colorView: unknown;
    depthView: unknown;
    commands: string[];
}

interface FakeLabeled {
    label: string;
}

interface FakeBatchRecordOptions {
    renderPipeline: string;
    vertexBuffers: string[];
    indexBuffer: string | null;
    drawCount: number;
}

const PREFERRED_CANVAS_FORMAT = 'rgba8unorm';

const TEXTURE_USAGE = Object.freeze({ RENDER_ATTACHMENT: 16 });

function createFakeDevice() {
    const textures: FakeTexture[] = [];
    const renderPasses: FakeRenderPass[] = [];
    const submissions: unknown[][] = [];

    function createTexture(descriptor: GPUTextureDescriptor) {
        const [width, height] = descriptor.size as number[];

        const texture = {
            width,
            height,
            depthOrArrayLayers: 1,
            dimension: '2d',
            format: descriptor.format,
            usage: descriptor.usage,
            sampleCount: 1,
            mipLevelCount: 1,
            destroyCount: 0,
            createView: () => ({ texture }),
            destroy() {
                texture.destroyCount++;
            },
        };

        textures.push(texture);

        return texture;
    }

    function createCommandEncoder() {
        const commandBuffer = {};

        return {
            beginRenderPass(descriptor: GPURenderPassDescriptor) {
                const [colorAttachment] = descriptor.colorAttachments as GPURenderPassColorAttachment[];
                const commands: string[] = [];

                renderPasses.push({
                    colorView: colorAttachment.view,
                    depthView: descriptor.depthStencilAttachment?.view,
                    commands,
                });

                return {
                    setBindGroup: (index: number, bindGroup: FakeLabeled) => {
                        commands.push(`setBindGroup ${index} ${bindGroup.label}`);
                    },
                    setPipeline: (renderPipeline: FakeLabeled) => {
                        commands.push(`setPipeline ${renderPipeline.label}`);
                    },
                    setVertexBuffer: (slot: number, buffer: FakeLabeled) => {
                        commands.push(`setVertexBuffer ${slot} ${buffer.label}`);
                    },
                    setIndexBuffer: (buffer: FakeLabeled, indexFormat: GPUIndexFormat) => {
                        commands.push(`setIndexBuffer ${buffer.label} ${indexFormat}`);
                    },
                    draw: (...parameters: number[]) => {
                        commands.push(`draw ${parameters.join(' ')}`);
                    },
                    drawIndexed: (...parameters: number[]) => {
                        commands.push(`drawIndexed ${parameters.join(' ')}`);
                    },
                    end: () => {
                        commands.push('end');
                    },
                };
            },
            finish: () => commandBuffer,
        };
    }

    const gpuDevice = {
        lost: new Promise<GPUDeviceLostInfo>(() => {}),
        queue: { submit: (commandBuffers: unknown[]) => submissions.push(commandBuffers) },
        addEventListener: () => {},
        createTexture,
        createCommandEncoder,
    } as unknown as GPUDevice;

    return {
        gpuDevice,
        textures,
        renderPasses,
        submissions,
    };
}

function createFakeCanvasContext(width: number, height: number) {
    const canvasElement = { width, height };
    const canvasTextureViews: object[] = [];

    const canvasContext = {
        canvas: canvasElement,
        getCurrentTexture: () => ({
            createView: () => {
                const canvasTextureView = {};

                canvasTextureViews.push(canvasTextureView);

                return canvasTextureView;
            },
        }),
    } as unknown as GPUCanvasContext;

    return { canvasContext, canvasElement, canvasTextureViews };
}

function createSubject(canvasWidth: number, canvasHeight: number) {
    const fakeDevice = createFakeDevice();
    const fakeCanvasContext = createFakeCanvasContext(canvasWidth, canvasHeight);
    const renderDevice = new RenderDevice(fakeDevice.gpuDevice, PREFERRED_CANVAS_FORMAT);
    const renderPhase = new RendererRenderPhase(renderDevice, fakeCanvasContext.canvasContext);

    return { renderPhase, ...fakeDevice, ...fakeCanvasContext };
}

function createFrameResources(batchRecordOptions: FakeBatchRecordOptions[]) {
    const labeledObjects = new Map<string, FakeLabeled>();

    function findOrCreateLabeled<T>(label: string) {
        let labeled = labeledObjects.get(label) ?? null;

        if (labeled === null) {
            labeled = { label };

            labeledObjects.set(label, labeled);
        }

        return labeled as unknown as T;
    }

    const batchRecords = batchRecordOptions.map((options) => {
        let indexBuffer: GPUBuffer | null = null;
        let indexFormat: GPUIndexFormat | null = null;

        if (options.indexBuffer !== null) {
            indexBuffer = findOrCreateLabeled<GPUBuffer>(options.indexBuffer);
            indexFormat = 'uint16';
        }

        return {
            renderPipeline: findOrCreateLabeled<GPURenderPipeline>(options.renderPipeline),
            vertexBuffers: options.vertexBuffers.map((label) => findOrCreateLabeled<GPUBuffer>(label)),
            indexBuffer,
            indexFormat,
            drawCount: options.drawCount,
        };
    });

    const frameResources: RenderFrameResources = {
        cameraBindGroup: findOrCreateLabeled<GPUBindGroup>('cameraBindGroup'),
        meshBindGroup: findOrCreateLabeled<GPUBindGroup>('meshBindGroup'),
        batchRecords,
    };

    return frameResources;
}

function createFrameDrawList(drawIndexToMeshIndex: number[], drawIndexToBatchIndex: number[]) {
    const frameDrawList: RenderFrameDrawList = {
        drawCount: drawIndexToMeshIndex.length,
        drawIndexToMeshIndex,
        drawIndexToBatchIndex,
    };

    return frameDrawList;
}

describe('RendererRenderPhase', () => {
    before(() => {
        Object.assign(globalThis, { GPUTextureUsage: TEXTURE_USAGE });
    });

    after(() => {
        Reflect.deleteProperty(globalThis, 'GPUTextureUsage');
    });

    describe('constructor', () => {
        it('creates a depth texture of the size of the canvas', () => {
            const { textures } = createSubject(800, 600);

            assert.equal(textures.length, 1);
            assert.equal(textures[0].width, 800);
            assert.equal(textures[0].height, 600);
        });

        it('creates a depth texture of one texel for a canvas without area', () => {
            const { textures } = createSubject(0, 0);

            assert.equal(textures[0].width, 1);
            assert.equal(textures[0].height, 1);
        });

        it('replaces only the side of the depth texture that the canvas lacks', () => {
            const { textures } = createSubject(0, 600);

            assert.equal(textures[0].width, 1);
            assert.equal(textures[0].height, 600);
        });
    });

    describe('execute()', () => {
        it('submits one command buffer with one render pass for each call', () => {
            const { renderPhase, renderPasses, submissions } = createSubject(800, 600);

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));
            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.equal(renderPasses.length, 2);
            assert.equal(submissions.length, 2);
            assert.equal(submissions[0].length, 1);
        });

        it('draws into the current texture of the canvas and the depth texture', () => {
            const { renderPhase, renderPasses, canvasTextureViews, textures } = createSubject(800, 600);

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.equal(renderPasses[0].colorView, canvasTextureViews[0]);
            assert.deepEqual(renderPasses[0].depthView, { texture: textures[0] });
        });

        it('takes a new texture of the canvas in each frame', () => {
            const { renderPhase, renderPasses, canvasTextureViews } = createSubject(800, 600);

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));
            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.equal(renderPasses[1].colorView, canvasTextureViews[1]);
            assert.notEqual(renderPasses[1].colorView, renderPasses[0].colorView);
        });

        it('replaces the depth texture when the size of the canvas changes', () => {
            const { renderPhase, renderPasses, textures, canvasElement } = createSubject(800, 600);

            canvasElement.width = 400;
            canvasElement.height = 300;

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.equal(textures.length, 2);
            assert.equal(textures[0].destroyCount, 1);
            assert.equal(textures[1].width, 400);
            assert.equal(textures[1].height, 300);
            assert.deepEqual(renderPasses[0].depthView, { texture: textures[1] });
        });

        it('keeps the depth texture while the size of the canvas is unchanged', () => {
            const { renderPhase, textures } = createSubject(800, 600);

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));
            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.equal(textures.length, 1);
            assert.equal(textures[0].destroyCount, 0);
        });

        it('sets the bind groups of the camera and of the meshes once for an empty frame draw list', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);

            renderPhase.execute(createFrameResources([]), createFrameDrawList([], []));

            assert.deepEqual(renderPasses[0].commands, [
                'setBindGroup 0 cameraBindGroup',
                'setBindGroup 1 meshBindGroup',
                'end',
            ]);
        });

        it('draws a geometry without indices by its vertices, with the index of the mesh as the first instance', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: null,
                    drawCount: 3,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([5], [0]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'draw 3 1 0 5',
                'end',
            ]);
        });

        it('draws a geometry with indices by its indices, with the index of the mesh as the first instance', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: 'indexBufferA',
                    drawCount: 36,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([5], [0]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'setIndexBuffer indexBufferA uint16',
                'drawIndexed 36 1 0 0 5',
                'end',
            ]);
        });

        it('draws every mesh of a batch with indices and sets its buffers once', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: 'indexBufferA',
                    drawCount: 36,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([0, 2], [0, 0]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'setIndexBuffer indexBufferA uint16',
                'drawIndexed 36 1 0 0 0',
                'drawIndexed 36 1 0 0 2',
                'end',
            ]);
        });

        it('sets the render pipeline only when it changes', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: null,
                    drawCount: 3,
                },
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferB'],
                    indexBuffer: null,
                    drawCount: 6,
                },
                {
                    renderPipeline: 'renderPipelineB',
                    vertexBuffers: ['positionBufferB'],
                    indexBuffer: null,
                    drawCount: 6,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([0, 1, 2], [0, 1, 2]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'draw 3 1 0 0',
                'setVertexBuffer 0 positionBufferB',
                'draw 6 1 0 1',
                'setPipeline renderPipelineB',
                'draw 6 1 0 2',
                'end',
            ]);
        });

        it('sets the vertex buffer of a slot only when the buffer of that slot changes', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA', 'normalBuffer'],
                    indexBuffer: null,
                    drawCount: 3,
                },
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferB', 'normalBuffer'],
                    indexBuffer: null,
                    drawCount: 3,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([0, 1], [0, 1]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'setVertexBuffer 1 normalBuffer',
                'draw 3 1 0 0',
                'setVertexBuffer 0 positionBufferB',
                'draw 3 1 0 1',
                'end',
            ]);
        });

        it('sets the index buffer only when it changes', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: 'indexBufferA',
                    drawCount: 36,
                },
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: null,
                    drawCount: 24,
                },
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: 'indexBufferB',
                    drawCount: 6,
                },
            ]);

            renderPhase.execute(frameResources, createFrameDrawList([0, 1, 2], [0, 1, 2]));

            assert.deepEqual(renderPasses[0].commands.slice(2), [
                'setPipeline renderPipelineA',
                'setVertexBuffer 0 positionBufferA',
                'setIndexBuffer indexBufferA uint16',
                'drawIndexed 36 1 0 0 0',
                'draw 24 1 0 1',
                'setIndexBuffer indexBufferB uint16',
                'drawIndexed 6 1 0 0 2',
                'end',
            ]);
        });

        it('sets the render pipeline and the buffers again in the next frame', () => {
            const { renderPhase, renderPasses } = createSubject(800, 600);
            const frameResources = createFrameResources([
                {
                    renderPipeline: 'renderPipelineA',
                    vertexBuffers: ['positionBufferA'],
                    indexBuffer: 'indexBufferA',
                    drawCount: 36,
                },
            ]);
            const frameDrawList = createFrameDrawList([0], [0]);

            renderPhase.execute(frameResources, frameDrawList);
            renderPhase.execute(frameResources, frameDrawList);

            assert.deepEqual(renderPasses[1].commands, renderPasses[0].commands);
        });
    });
});
