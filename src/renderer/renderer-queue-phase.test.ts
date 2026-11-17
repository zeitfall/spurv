import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RendererQueuePhase } from './renderer-queue-phase.ts';

import type {
    RenderFramePacket,
    RenderFrameResources,
    RenderFrameDrawList,
} from './types.ts';

function createRenderPipeline() {
    return {} as unknown as GPURenderPipeline;
}

function createFramePacket(meshIndexToBatchIndex: number[]) {
    const framePacket: RenderFramePacket = {
        cameraViewProjectionArray: new Float32Array(16),
        meshCount: meshIndexToBatchIndex.length,
        meshWorldMatrixArray: new Float32Array(16 * meshIndexToBatchIndex.length),
        meshIndexToBatchIndex,
        batches: [],
    };

    return framePacket;
}

function createFrameResources(batchRenderPipelines: GPURenderPipeline[]) {
    const frameResources: RenderFrameResources = {
        cameraBindGroup: {} as unknown as GPUBindGroup,
        meshBindGroup: {} as unknown as GPUBindGroup,
        batchRecords: batchRenderPipelines.map((renderPipeline) => ({
            renderPipeline,
            vertexBuffers: [],
            indexBuffer: null,
            indexFormat: null,
            drawCount: 0,
        })),
    };

    return frameResources;
}

function readDraws(frameDrawList: RenderFrameDrawList) {
    return {
        meshIndices: frameDrawList.drawIndexToMeshIndex.slice(0, frameDrawList.drawCount),
        batchIndices: frameDrawList.drawIndexToBatchIndex.slice(0, frameDrawList.drawCount),
    };
}

describe('RendererQueuePhase', () => {
    describe('execute()', () => {
        it('returns the same frame draw list on every call', () => {
            const queuePhase = new RendererQueuePhase();
            const framePacket = createFramePacket([]);
            const frameResources = createFrameResources([]);

            const frameDrawListA = queuePhase.execute(framePacket, frameResources);
            const frameDrawListB = queuePhase.execute(framePacket, frameResources);

            assert.equal(frameDrawListA, frameDrawListB);
        });

        it('reports no draws for a frame without meshes', () => {
            const queuePhase = new RendererQueuePhase();

            const frameDrawList = queuePhase.execute(createFramePacket([]), createFrameResources([]));

            assert.equal(frameDrawList.drawCount, 0);
        });

        it('lists one draw for each mesh', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([0, 1, 1, 0, 1]),
                createFrameResources([renderPipelineA, renderPipelineB]),
            );

            assert.equal(frameDrawList.drawCount, 5);
        });

        it('keeps the meshes of one batch in the order of their indices', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipeline = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([0, 0, 0]),
                createFrameResources([renderPipeline]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [0, 1, 2],
                batchIndices: [0, 0, 0],
            });
        });

        it('places the batches of one render pipeline next to each other', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([0, 1, 2]),
                createFrameResources([renderPipelineA, renderPipelineB, renderPipelineA]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [0, 2, 1],
                batchIndices: [0, 2, 1],
            });
        });

        it('places the meshes of one batch next to each other within their render pipeline', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([0, 1, 2, 0]),
                createFrameResources([renderPipelineA, renderPipelineB, renderPipelineA]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [0, 3, 2, 1],
                batchIndices: [0, 0, 2, 1],
            });
        });

        it('orders the render pipelines by the first batch that uses each of them', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([1, 0, 1]),
                createFrameResources([renderPipelineB, renderPipelineA]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [1, 0, 2],
                batchIndices: [0, 1, 1],
            });
        });

        it('orders the batches of one render pipeline by their indices', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipeline = createRenderPipeline();

            const frameDrawList = queuePhase.execute(
                createFramePacket([1, 0, 1, 0]),
                createFrameResources([renderPipeline, renderPipeline]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [1, 3, 0, 2],
                batchIndices: [0, 0, 1, 1],
            });
        });

        it('lists only the draws of the current frame after a frame with more meshes', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();

            queuePhase.execute(
                createFramePacket([0, 1, 2, 0]),
                createFrameResources([renderPipelineA, renderPipelineB, renderPipelineA]),
            );

            const frameDrawList = queuePhase.execute(
                createFramePacket([1, 0]),
                createFrameResources([renderPipelineA, renderPipelineB]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [1, 0],
                batchIndices: [0, 1],
            });
        });

        it('forgets the batches and the render pipelines of the previous frame', () => {
            const queuePhase = new RendererQueuePhase();
            const renderPipelineA = createRenderPipeline();
            const renderPipelineB = createRenderPipeline();
            const renderPipelineC = createRenderPipeline();

            queuePhase.execute(
                createFramePacket([0, 1, 2]),
                createFrameResources([renderPipelineA, renderPipelineB, renderPipelineA]),
            );

            const frameDrawList = queuePhase.execute(
                createFramePacket([0, 0]),
                createFrameResources([renderPipelineC]),
            );

            assert.deepEqual(readDraws(frameDrawList), {
                meshIndices: [0, 1],
                batchIndices: [0, 0],
            });
        });
    });
});
