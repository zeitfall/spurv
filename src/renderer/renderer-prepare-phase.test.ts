import assert from 'node:assert/strict';

import {
    after,
    before,
    describe,
    it,
} from 'node:test';

import { RenderDevice } from '../gpu/index.ts';

import {
    Geometry,
    VertexAttribute,
    VertexAttributeName,
    VertexFormat,
} from '../geometry/index.ts';

import type { ShaderDescriptor } from '../shaders/index.ts';

import { Material, NormalMaterial } from '../materials/index.ts';

import { RendererPreparePhase } from './renderer-prepare-phase.ts';

import type { RenderBatch, RenderFramePacket } from './types.ts';

interface FakeBuffer {
    size: number;
    usage: number;
    contents: ArrayBuffer;
    destroyCount: number;
    getMappedRange(): ArrayBuffer;
    unmap(): void;
    destroy(): void;
}

interface FakeWrite {
    buffer: FakeBuffer;
    bufferOffset: number;
    data: ArrayBufferView;
}

const PREFERRED_CANVAS_FORMAT = 'rgba8unorm';

const BUFFER_USAGE = Object.freeze({ COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64, STORAGE: 128 });

const MESH_COUNT = 64;

const OTHER_SHADER: Readonly<ShaderDescriptor> = Object.freeze({
    code: 'other',
    vertexStageEntryPoint: 'otherVertexStage',
    fragmentStageEntryPoint: 'otherFragmentStage',
    requiredAttributeNames: Object.freeze([VertexAttributeName.POSITION]),
});

class OtherMaterial extends Material {
    override get shader() {
        return OTHER_SHADER;
    }
}

function createFakeDevice() {
    const buffers: FakeBuffer[] = [];
    const writes: FakeWrite[] = [];
    const shaderCodes: string[] = [];
    const bindGroupDescriptors: GPUBindGroupDescriptor[] = [];
    const renderPipelines: object[] = [];
    const renderPipelineDescriptors: GPURenderPipelineDescriptor[] = [];

    function createBuffer(descriptor: GPUBufferDescriptor) {
        const contents = new ArrayBuffer(descriptor.size);

        const buffer: FakeBuffer = {
            size: descriptor.size,
            usage: descriptor.usage,
            contents,
            destroyCount: 0,
            getMappedRange: () => contents,
            unmap: () => {},
            destroy() {
                buffer.destroyCount++;
            },
        };

        buffers.push(buffer);

        return buffer;
    }

    function writeBuffer(buffer: FakeBuffer, bufferOffset: number, data: ArrayBufferView) {
        if (data.byteLength % 4 !== 0) {
            throw new Error('writeBuffer: expected a byte length that is a multiple of 4.');
        }

        const dataBytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

        new Uint8Array(buffer.contents).set(dataBytes, bufferOffset);

        writes.push({ buffer, bufferOffset, data });
    }

    function createShaderModule(descriptor: GPUShaderModuleDescriptor) {
        shaderCodes.push(descriptor.code);

        return { getCompilationInfo: async () => ({ messages: [] }) };
    }

    function createBindGroup(descriptor: GPUBindGroupDescriptor) {
        bindGroupDescriptors.push(descriptor);

        return {};
    }

    function createRenderPipeline(descriptor: GPURenderPipelineDescriptor) {
        const renderPipeline = {};

        renderPipelines.push(renderPipeline);
        renderPipelineDescriptors.push(descriptor);

        return renderPipeline;
    }

    const gpuDevice = {
        lost: new Promise<GPUDeviceLostInfo>(() => {}),
        queue: { writeBuffer },
        addEventListener: () => {},
        createBuffer,
        createShaderModule,
        createBindGroupLayout: () => ({}),
        createBindGroup,
        createPipelineLayout: () => ({}),
        createRenderPipeline,
    } as unknown as GPUDevice;

    return {
        gpuDevice,
        buffers,
        writes,
        shaderCodes,
        bindGroupDescriptors,
        renderPipelines,
        renderPipelineDescriptors,
    };
}

function createSubject() {
    const fakeDevice = createFakeDevice();
    const renderDevice = new RenderDevice(fakeDevice.gpuDevice, PREFERRED_CANVAS_FORMAT);
    const preparePhase = new RendererPreparePhase(renderDevice);

    return { preparePhase, ...fakeDevice };
}

function createTriangleGeometry() {
    const positionAttribute = new VertexAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], VertexFormat.FLOAT32X3);
    const normalAttribute = new VertexAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X3);
    const uvAttribute = new VertexAttribute([0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X2);

    const geometry = new Geometry()
        .setAttribute(VertexAttributeName.POSITION, positionAttribute)
        .setAttribute(VertexAttributeName.NORMAL, normalAttribute)
        .setAttribute(VertexAttributeName.UV, uvAttribute);

    return { geometry, positionAttribute, normalAttribute };
}

function createBatch(index: number, geometry: Geometry, material: Material) {
    const batch: RenderBatch = {
        index,
        geometry,
        material,
        updatedAtFrame: 0,
    };

    return batch;
}

function createFramePacket(batches: RenderBatch[], meshCount = MESH_COUNT) {
    const framePacket: RenderFramePacket = {
        cameraViewProjectionArray: new Float32Array(16),
        meshCount: batches.length,
        meshWorldMatrixArray: new Float32Array(16 * meshCount),
        meshIndexToBatchIndex: batches.map((batch) => batch.index),
        batches,
    };

    return framePacket;
}

function findBuffersWithUsage(buffers: FakeBuffer[], usage: number) {
    return buffers.filter((buffer) => (buffer.usage & usage) !== 0);
}

function findLiveBuffersWithUsage(buffers: FakeBuffer[], usage: number) {
    return findBuffersWithUsage(buffers, usage).filter((buffer) => buffer.destroyCount === 0);
}

function findWritesWithUsage(writes: FakeWrite[], usage: number) {
    return writes.filter((write) => (write.buffer.usage & usage) !== 0);
}

describe('RendererPreparePhase', () => {
    before(() => {
        Object.assign(globalThis, {
            GPUBufferUsage: BUFFER_USAGE,
            GPUShaderStage: { VERTEX: 1, FRAGMENT: 2 },
        });
    });

    after(() => {
        Reflect.deleteProperty(globalThis, 'GPUBufferUsage');
        Reflect.deleteProperty(globalThis, 'GPUShaderStage');
    });

    describe('execute()', () => {
        it('returns the same frame resources on every call', () => {
            const { preparePhase } = createSubject();
            const framePacket = createFramePacket([]);

            const frameResourcesA = preparePhase.execute(framePacket);
            const frameResourcesB = preparePhase.execute(framePacket);

            assert.equal(frameResourcesA, frameResourcesB);
        });

        it('writes the view-projection matrix of the camera into a uniform buffer of 64 bytes', () => {
            const { preparePhase, buffers, writes } = createSubject();
            const framePacket = createFramePacket([]);

            preparePhase.execute(framePacket);

            const uniformBuffers = findBuffersWithUsage(buffers, BUFFER_USAGE.UNIFORM);
            const uniformWrites = findWritesWithUsage(writes, BUFFER_USAGE.UNIFORM);

            assert.equal(uniformBuffers.length, 1);
            assert.equal(uniformBuffers[0].size, 64);
            assert.equal(uniformWrites.length, 1);
            assert.equal(uniformWrites[0].data, framePacket.cameraViewProjectionArray);
            assert.equal(uniformWrites[0].bufferOffset, 0);
        });

        it('writes the world matrices of the meshes into a storage buffer of the size of their array', () => {
            const { preparePhase, buffers, writes } = createSubject();
            const framePacket = createFramePacket([]);

            preparePhase.execute(framePacket);

            const storageBuffers = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.STORAGE);
            const storageWrites = findWritesWithUsage(writes, BUFFER_USAGE.STORAGE);

            assert.equal(storageBuffers.length, 1);
            assert.equal(storageBuffers[0].size, 4096);
            assert.equal(storageWrites.length, 1);
            assert.equal(storageWrites[0].buffer, storageBuffers[0]);
            assert.equal(storageWrites[0].data, framePacket.meshWorldMatrixArray);
            assert.equal(storageWrites[0].bufferOffset, 0);
        });

        it('keeps the bind groups while the array of the world matrices keeps its size', () => {
            const { preparePhase, bindGroupDescriptors } = createSubject();
            const framePacket = createFramePacket([]);

            const { cameraBindGroup, meshBindGroup } = preparePhase.execute(framePacket);
            const bindGroupCount = bindGroupDescriptors.length;
            const frameResources = preparePhase.execute(framePacket);

            assert.equal(frameResources.cameraBindGroup, cameraBindGroup);
            assert.equal(frameResources.meshBindGroup, meshBindGroup);
            assert.equal(bindGroupDescriptors.length, bindGroupCount);
        });

        it('replaces the storage buffer and the bind group of the meshes when the array grows', () => {
            const { preparePhase, buffers, bindGroupDescriptors } = createSubject();

            const { cameraBindGroup, meshBindGroup } = preparePhase.execute(createFramePacket([]));
            const [storageBufferA] = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.STORAGE);
            const frameResources = preparePhase.execute(createFramePacket([], 2 * MESH_COUNT));

            const storageBuffers = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.STORAGE);
            const meshBindGroupDescriptor = bindGroupDescriptors[bindGroupDescriptors.length - 1];
            const meshBindGroupEntries = [...meshBindGroupDescriptor.entries];

            assert.equal(storageBufferA.destroyCount, 1);
            assert.equal(storageBuffers.length, 1);
            assert.equal(storageBuffers[0].size, 8192);
            assert.equal(frameResources.cameraBindGroup, cameraBindGroup);
            assert.notEqual(frameResources.meshBindGroup, meshBindGroup);
            assert.equal(meshBindGroupEntries[0].resource, storageBuffers[0]);
        });

        it('stores the record of each batch at the index of that batch', () => {
            const { preparePhase } = createSubject();
            const material = new NormalMaterial();
            const batchA = createBatch(0, createTriangleGeometry().geometry, material);
            const batchB = createBatch(1, createTriangleGeometry().geometry, material);

            const { batchRecords } = preparePhase.execute(createFramePacket([batchA, batchB]));

            assert.equal(batchRecords.length, 2);
            assert.notEqual(batchRecords[0], batchRecords[1]);
        });

        it('retains the record of a batch between frames and drops the records of absent batches', () => {
            const { preparePhase } = createSubject();
            const material = new NormalMaterial();
            const batchA = createBatch(0, createTriangleGeometry().geometry, material);
            const batchB = createBatch(1, createTriangleGeometry().geometry, material);

            const batchRecordB = preparePhase.execute(createFramePacket([batchA, batchB])).batchRecords[1];

            batchB.index = 0;

            const { batchRecords } = preparePhase.execute(createFramePacket([batchB]));

            assert.equal(batchRecords.length, 1);
            assert.equal(batchRecords[0], batchRecordB);
        });

        it('creates one vertex buffer for each attribute that the shader requires, in the required order', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batch = createBatch(0, geometry, new NormalMaterial());

            const { batchRecords } = preparePhase.execute(createFramePacket([batch]));

            const vertexBuffers = findBuffersWithUsage(buffers, BUFFER_USAGE.VERTEX);

            assert.equal(vertexBuffers.length, 2);
            assert.deepEqual(batchRecords[0].vertexBuffers, vertexBuffers);
            assert.deepEqual([...new Float32Array(vertexBuffers[0].contents)], [0, 0, 0, 1, 0, 0, 0, 1, 0]);
            assert.deepEqual([...new Float32Array(vertexBuffers[1].contents)], [0, 0, 1, 0, 0, 1, 0, 0, 1]);
        });

        it('shares the vertex buffers of an attribute between the batches that use it', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batchA = createBatch(0, geometry, new NormalMaterial());
            const batchB = createBatch(1, geometry, new OtherMaterial());

            const { batchRecords } = preparePhase.execute(createFramePacket([batchA, batchB]));

            assert.equal(findBuffersWithUsage(buffers, BUFFER_USAGE.VERTEX).length, 2);
            assert.equal(batchRecords[1].vertexBuffers.length, 1);
            assert.equal(batchRecords[1].vertexBuffers[0], batchRecords[0].vertexBuffers[0]);
        });

        it('writes an attribute again only when its version changes', () => {
            const { preparePhase, buffers, writes } = createSubject();
            const { geometry, positionAttribute } = createTriangleGeometry();
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            preparePhase.execute(framePacket);

            const vertexWriteCount = findWritesWithUsage(writes, BUFFER_USAGE.VERTEX).length;

            preparePhase.execute(framePacket);

            assert.equal(findWritesWithUsage(writes, BUFFER_USAGE.VERTEX).length, vertexWriteCount);

            positionAttribute.setVertexFromArray(0, [5, 6, 7]);
            preparePhase.execute(framePacket);

            const vertexBuffers = findBuffersWithUsage(buffers, BUFFER_USAGE.VERTEX);
            const vertexWrites = findWritesWithUsage(writes, BUFFER_USAGE.VERTEX);

            assert.equal(vertexBuffers.length, 2);
            assert.equal(vertexWrites.length, vertexWriteCount + 1);
            assert.equal(vertexWrites[vertexWriteCount].buffer, vertexBuffers[0]);
            assert.deepEqual([...new Float32Array(vertexBuffers[0].contents)], [5, 6, 7, 1, 0, 0, 0, 1, 0]);
        });

        it('throws an Error for a geometry that lacks an attribute that the shader requires', () => {
            const { preparePhase } = createSubject();
            const positionAttribute = new VertexAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], VertexFormat.FLOAT32X3);
            const geometry = new Geometry().setAttribute(VertexAttributeName.POSITION, positionAttribute);
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            assert.throws(() => preparePhase.execute(framePacket), {
                name: 'Error',
                message: 'Renderer.render: expected a geometry with the attribute NORMAL, received a geometry without it.',
            });
        });

        it('draws a geometry without indices by the number of its vertices', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batch = createBatch(0, geometry, new NormalMaterial());

            const { batchRecords } = preparePhase.execute(createFramePacket([batch]));

            assert.equal(batchRecords[0].indexBuffer, null);
            assert.equal(batchRecords[0].indexFormat, null);
            assert.equal(batchRecords[0].drawCount, 3);
            assert.equal(findBuffersWithUsage(buffers, BUFFER_USAGE.INDEX).length, 0);
        });

        it('draws a geometry with 16-bit indices by the number of its indices', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batch = createBatch(0, geometry, new NormalMaterial());

            geometry.setIndices(new Uint16Array([0, 1, 2, 2, 1, 0]));

            const { batchRecords } = preparePhase.execute(createFramePacket([batch]));

            const indexBuffers = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            assert.equal(indexBuffers.length, 1);
            assert.equal(batchRecords[0].indexBuffer, indexBuffers[0]);
            assert.equal(batchRecords[0].indexFormat, 'uint16');
            assert.equal(batchRecords[0].drawCount, 6);
            assert.deepEqual([...new Uint16Array(indexBuffers[0].contents)], [0, 1, 2, 2, 1, 0]);
        });

        it('draws a geometry with 32-bit indices in the format of those indices', () => {
            const { preparePhase } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batch = createBatch(0, geometry, new NormalMaterial());

            geometry.setIndices(new Uint32Array([0, 1, 2]));

            const { batchRecords } = preparePhase.execute(createFramePacket([batch]));

            assert.equal(batchRecords[0].indexFormat, 'uint32');
            assert.equal(batchRecords[0].drawCount, 3);
        });

        it('creates one index buffer for the indices of a new geometry', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();

            geometry.setIndices(new Uint16Array([0, 1, 2, 2, 1, 0]));
            preparePhase.execute(createFramePacket([createBatch(0, geometry, new NormalMaterial())]));

            assert.equal(findBuffersWithUsage(buffers, BUFFER_USAGE.INDEX).length, 1);
        });

        it('uploads 16-bit indices whose byte length is not a multiple of 4', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            geometry.setIndices(new Uint16Array([0, 1, 2]));
            preparePhase.execute(framePacket);

            const [indexBufferA] = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            geometry.setIndices(new Uint16Array([2, 1, 0]));
            preparePhase.execute(framePacket);

            const [indexBufferB] = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            assert.equal(indexBufferA.size, 8);
            assert.deepEqual([...new Uint16Array(indexBufferA.contents, 0, 3)], [0, 1, 2]);
            assert.equal(indexBufferB.size, 8);
            assert.deepEqual([...new Uint16Array(indexBufferB.contents, 0, 3)], [2, 1, 0]);
        });

        it('replaces the index buffer only when the version of the geometry changes', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            geometry.setIndices(new Uint16Array([0, 1, 2, 2, 1, 0]));
            preparePhase.execute(framePacket);

            const [indexBufferA] = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            preparePhase.execute(framePacket);

            assert.deepEqual(findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX), [indexBufferA]);

            geometry.setIndices(new Uint16Array([2, 1, 0, 0, 1, 2]));

            const { batchRecords } = preparePhase.execute(framePacket);

            const indexBuffers = findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX);

            assert.equal(indexBufferA.destroyCount, 1);
            assert.equal(indexBuffers.length, 1);
            assert.notEqual(indexBuffers[0], indexBufferA);
            assert.equal(batchRecords[0].indexBuffer, indexBuffers[0]);
        });

        it('destroys the index buffer of a geometry that loses its indices', () => {
            const { preparePhase, buffers } = createSubject();
            const { geometry } = createTriangleGeometry();
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            geometry.setIndices(new Uint16Array([0, 1, 2, 2, 1, 0]));
            preparePhase.execute(framePacket);

            geometry.setIndices(null);

            const { batchRecords } = preparePhase.execute(framePacket);

            assert.equal(findLiveBuffersWithUsage(buffers, BUFFER_USAGE.INDEX).length, 0);
            assert.equal(batchRecords[0].indexBuffer, null);
            assert.equal(batchRecords[0].indexFormat, null);
            assert.equal(batchRecords[0].drawCount, 3);
        });

        it('describes a render pipeline by the shader and the formats of the required attributes', () => {
            const { preparePhase, renderPipelines, renderPipelineDescriptors } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batch = createBatch(0, geometry, new NormalMaterial());

            const { batchRecords } = preparePhase.execute(createFramePacket([batch]));

            const { vertex, fragment, primitive, depthStencil } = renderPipelineDescriptors[0];

            assert.equal(renderPipelines.length, 1);
            assert.equal(batchRecords[0].renderPipeline, renderPipelines[0]);
            assert.equal(vertex.entryPoint, 'vertexStage');
            assert.deepEqual(vertex.buffers, [
                {
                    arrayStride: 12,
                    stepMode: 'vertex',
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
                },
                {
                    arrayStride: 12,
                    stepMode: 'vertex',
                    attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }],
                },
            ]);
            assert.equal(fragment?.entryPoint, 'fragmentStage');
            assert.deepEqual(fragment?.targets, [{ format: PREFERRED_CANVAS_FORMAT }]);
            assert.deepEqual(primitive, { topology: 'triangle-list', cullMode: 'back' });
            assert.deepEqual(depthStencil, {
                format: 'depth32float',
                depthCompare: 'greater-equal',
                depthWriteEnabled: true,
            });
        });

        it('shares one render pipeline and one shader module between geometries of the same formats', () => {
            const { preparePhase, shaderCodes, renderPipelines } = createSubject();
            const batchA = createBatch(0, createTriangleGeometry().geometry, new NormalMaterial());
            const batchB = createBatch(1, createTriangleGeometry().geometry, new NormalMaterial());
            const framePacket = createFramePacket([batchA, batchB]);

            preparePhase.execute(framePacket);

            const { batchRecords } = preparePhase.execute(framePacket);

            assert.equal(shaderCodes.length, 1);
            assert.equal(renderPipelines.length, 1);
            assert.equal(batchRecords[0].renderPipeline, batchRecords[1].renderPipeline);
        });

        it('creates a render pipeline for each shader', () => {
            const { preparePhase, shaderCodes, renderPipelines, renderPipelineDescriptors } = createSubject();
            const { geometry } = createTriangleGeometry();
            const batchA = createBatch(0, geometry, new NormalMaterial());
            const batchB = createBatch(1, geometry, new OtherMaterial());

            const { batchRecords } = preparePhase.execute(createFramePacket([batchA, batchB]));

            assert.equal(shaderCodes.length, 2);
            assert.equal(shaderCodes[1], 'other');
            assert.equal(renderPipelines.length, 2);
            assert.equal(batchRecords[1].renderPipeline, renderPipelines[1]);
            assert.equal(renderPipelineDescriptors[1].vertex.entryPoint, 'otherVertexStage');
            assert.deepEqual(renderPipelineDescriptors[1].vertex.buffers, [
                {
                    arrayStride: 12,
                    stepMode: 'vertex',
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
                },
            ]);
        });

        it('creates a render pipeline when an attribute is replaced by an attribute of another format', () => {
            const { preparePhase, renderPipelines, renderPipelineDescriptors } = createSubject();
            const { geometry } = createTriangleGeometry();
            const framePacket = createFramePacket([createBatch(0, geometry, new NormalMaterial())]);

            preparePhase.execute(framePacket);

            const flatPositionAttribute = new VertexAttribute([0, 0, 1, 0, 0, 1], VertexFormat.FLOAT32X2);

            geometry.setAttribute(VertexAttributeName.POSITION, flatPositionAttribute);

            const { batchRecords } = preparePhase.execute(framePacket);

            const vertexBufferLayouts = [...renderPipelineDescriptors[1].vertex.buffers ?? []];

            assert.equal(renderPipelines.length, 2);
            assert.equal(batchRecords[0].renderPipeline, renderPipelines[1]);
            assert.deepEqual(vertexBufferLayouts[0], {
                arrayStride: 8,
                stepMode: 'vertex',
                attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }],
            });
        });
    });
});
