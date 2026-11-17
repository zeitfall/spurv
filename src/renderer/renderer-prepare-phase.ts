import type { RenderDevice, RenderDeviceBuffer } from '../gpu/index.ts';

import {
    getGeometryIndexArray,
    getVertexAttributeArray,
    getVertexFormatByteSize,
    type Geometry,
    type VertexAttribute,
} from '../geometry/index.ts';

import { getVertexAttributeShaderLocation, type ShaderDescriptor } from '../shaders/index.ts';

import type {
    RenderBatch,
    RenderBatchRecord,
    RenderFramePacket,
    RenderFrameResources,
} from './types.ts';

interface RendererPreparePhaseBufferRecord {
    buffer: RenderDeviceBuffer;
    sourceVersion: number;
}

const DEFAULT_MESH_COUNT = 64;

/**
 * A phase of a frame that creates and updates the GPU resources of the frame from its frame packet.
 */
class RendererPreparePhase {
    #renderDevice: RenderDevice;

    #cameraUniformBuffer: RenderDeviceBuffer;
    #cameraBindGroupLayout: GPUBindGroupLayout;

    #meshStorageBuffer: RenderDeviceBuffer;
    #meshStorageBufferVersion: number;
    #meshBindGroupLayout: GPUBindGroupLayout;

    #vertexBufferRecords: WeakMap<VertexAttribute, RendererPreparePhaseBufferRecord>;
    #indexBufferRecords: WeakMap<Geometry, RendererPreparePhaseBufferRecord>;

    #shaderModules: WeakMap<ShaderDescriptor, GPUShaderModule>;

    #renderPipelineLayout: GPUPipelineLayout;
    #renderPipelines: WeakMap<ShaderDescriptor, Map<string, GPURenderPipeline>>;

    #batchRecords: WeakMap<RenderBatch, RenderBatchRecord>;

    #frameResources: RenderFrameResources;

    /**
     * Creates a prepare phase with the given render device.
     *
     * @param renderDevice - The render device that creates the GPU resources.
     */
    constructor(renderDevice: RenderDevice) {
        this.#renderDevice = renderDevice;

        this.#cameraUniformBuffer = renderDevice.createUniformBuffer(16 * Float32Array.BYTES_PER_ELEMENT);
        this.#cameraBindGroupLayout = renderDevice.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' },
                },
            ],
        });

        const cameraBindGroup = renderDevice.createBindGroup({
            layout: this.#cameraBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.#cameraUniformBuffer.raw,
                },
            ],
        });

        this.#meshStorageBuffer = renderDevice.createStorageBuffer(16 * DEFAULT_MESH_COUNT);
        this.#meshStorageBufferVersion = this.#meshStorageBuffer.version;
        this.#meshBindGroupLayout = renderDevice.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'read-only-storage' },
                },
            ],
        });

        const meshBindGroup = renderDevice.createBindGroup({
            layout: this.#meshBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.#meshStorageBuffer.raw,
                },
            ],
        });

        this.#vertexBufferRecords = new WeakMap();
        this.#indexBufferRecords = new WeakMap();

        this.#shaderModules = new WeakMap();

        this.#renderPipelineLayout = renderDevice.createPipelineLayout({
            bindGroupLayouts: [this.#cameraBindGroupLayout, this.#meshBindGroupLayout],
        });
        this.#renderPipelines = new WeakMap();

        this.#batchRecords = new WeakMap();

        this.#frameResources = {
            cameraBindGroup,
            meshBindGroup,
            batchRecords: [],
        };
    }

    /**
     * Updates the frame resources for the current frame from the given frame packet.
     *
     * @param framePacket - The frame packet of the current frame.
     *
     * @returns The frame resources of this prepare phase.
     *
     * @throws Error if a geometry of the frame lacks a vertex attribute that the shader of its material requires.
     *
     * @remarks The frame resources are valid until the next call.
     */
    execute(framePacket: RenderFramePacket) {
        this.#prepareCameraResources(framePacket);
        this.#prepareMeshResources(framePacket);
        this.#prepareBatchRecords(framePacket);

        return this.#frameResources;
    }

    #prepareCameraResources(framePacket: RenderFramePacket) {
        this.#cameraUniformBuffer.write(framePacket.cameraViewProjectionArray, 0);
    }

    #prepareMeshResources(framePacket: RenderFramePacket) {
        this.#meshStorageBuffer.resize(framePacket.meshWorldMatrixArray.byteLength);
        this.#meshStorageBuffer.write(framePacket.meshWorldMatrixArray, 0);

        if (this.#meshStorageBufferVersion !== this.#meshStorageBuffer.version) {
            this.#meshStorageBufferVersion = this.#meshStorageBuffer.version;

            this.#frameResources.meshBindGroup = this.#renderDevice.createBindGroup({
                layout: this.#meshBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: this.#meshStorageBuffer.raw,
                    },
                ],
            });
        }
    }

    #prepareBatchRecords(framePacket: RenderFramePacket) {
        this.#frameResources.batchRecords.length = 0;

        const batchCount = framePacket.batches.length;

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
            const batch = framePacket.batches[batchIndex];

            const attributes = this.#collectRequiredAttributes(batch);
            const vertexBuffers = this.#updateOrCreateVertexBuffers(attributes);
            const indexBuffer = this.#updateOrCreateIndexBuffer(batch);
            const shaderModule = this.#getOrCreateShaderModule(batch);
            const renderPipeline = this.#getOrCreateRenderPipeline(batch, attributes, shaderModule);

            this.#frameResources.batchRecords[batchIndex] = this.#updateOrCreateBatchRecord(
                batch,
                vertexBuffers,
                indexBuffer,
                renderPipeline,
            );
        }
    }

    #collectRequiredAttributes(batch: RenderBatch) {
        const attributes: VertexAttribute[] = [];

        for (const attributeName of batch.material.shader.requiredAttributeNames) {
            const attribute = batch.geometry.getAttribute(attributeName);

            if (attribute === null) {
                throw new Error(`Renderer.render: expected a geometry with the attribute ${attributeName}, received a geometry without it.`);
            }

            attributes.push(attribute);
        }

        return attributes;
    }

    #updateOrCreateVertexBuffers(attributes: VertexAttribute[]) {
        const vertexBuffers: GPUBuffer[] = [];

        for (const attribute of attributes) {
            const attributeArray = getVertexAttributeArray(attribute);
            let vertexBufferRecord = this.#vertexBufferRecords.get(attribute) ?? null;

            if (vertexBufferRecord === null) {
                const vertexBuffer = this.#renderDevice.createVertexBuffer(attributeArray.byteLength);

                vertexBufferRecord = { buffer: vertexBuffer, sourceVersion: -1 };
                this.#vertexBufferRecords.set(attribute, vertexBufferRecord);
            }

            if (vertexBufferRecord.sourceVersion !== attribute.version) {
                vertexBufferRecord.buffer.resize(attributeArray.byteLength);
                vertexBufferRecord.buffer.write(attributeArray, 0);
                vertexBufferRecord.sourceVersion = attribute.version;
            }

            vertexBuffers.push(vertexBufferRecord.buffer.raw);
        }

        return vertexBuffers;
    }

    #updateOrCreateIndexBuffer(batch: RenderBatch) {
        const indexArray = getGeometryIndexArray(batch.geometry);
        let indexBufferRecord = this.#indexBufferRecords.get(batch.geometry) ?? null;

        if (indexArray === null) {
            if (indexBufferRecord !== null) {
                indexBufferRecord.buffer.destroy();
                this.#indexBufferRecords.delete(batch.geometry);
            }

            return null;
        }

        if (indexBufferRecord === null) {
            const indexBuffer = this.#renderDevice.createIndexBufferWithData(indexArray);

            indexBufferRecord = { buffer: indexBuffer, sourceVersion: batch.geometry.version };
            this.#indexBufferRecords.set(batch.geometry, indexBufferRecord);
        }
        else if (indexBufferRecord.sourceVersion !== batch.geometry.version) {
            indexBufferRecord.buffer.destroy();

            indexBufferRecord.buffer = this.#renderDevice.createIndexBufferWithData(indexArray);
            indexBufferRecord.sourceVersion = batch.geometry.version;
        }

        return indexBufferRecord.buffer.raw;
    }

    #getOrCreateShaderModule(batch: RenderBatch) {
        let shaderModule = this.#shaderModules.get(batch.material.shader) ?? null;

        if (shaderModule === null) {
            shaderModule = this.#renderDevice.createShaderModule(batch.material.shader.code);

            this.#shaderModules.set(batch.material.shader, shaderModule);
        }

        return shaderModule;
    }

    #getOrCreateRenderPipeline(batch: RenderBatch, attributes: VertexAttribute[], shaderModule: GPUShaderModule) {
        let renderPipelineByKey = this.#renderPipelines.get(batch.material.shader) ?? null;

        if (renderPipelineByKey === null) {
            renderPipelineByKey = new Map();

            this.#renderPipelines.set(batch.material.shader, renderPipelineByKey);
        }

        let renderPipelineKey = '';

        for (const attribute of attributes) {
            renderPipelineKey += `${attribute.format}:`;
        }

        let renderPipeline = renderPipelineByKey.get(renderPipelineKey) ?? null;

        if (renderPipeline !== null) {
            return renderPipeline;
        }

        const attributeCount = attributes.length;

        const renderPipelineVertexBufferLayouts: GPUVertexBufferLayout[] = [];

        for (let attributeIndex = 0; attributeIndex < attributeCount; attributeIndex++) {
            const attribute = attributes[attributeIndex];
            const attributeName = batch.material.shader.requiredAttributeNames[attributeIndex];

            renderPipelineVertexBufferLayouts.push({
                arrayStride: getVertexFormatByteSize(attribute.format),
                stepMode: 'vertex',
                attributes: [
                    {
                        shaderLocation: getVertexAttributeShaderLocation(attributeName),
                        offset: 0,
                        format: attribute.format,
                    },
                ],
            });
        }

        renderPipeline = this.#renderDevice.createRenderPipeline({
            layout: this.#renderPipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: batch.material.shader.vertexStageEntryPoint,
                buffers: renderPipelineVertexBufferLayouts,
            },
            fragment: {
                module: shaderModule,
                entryPoint: batch.material.shader.fragmentStageEntryPoint,
                targets: [{ format: this.#renderDevice.preferredCanvasFormat }],
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'back',
            },
            depthStencil: {
                format: 'depth32float',
                depthCompare: 'greater-equal',
                depthWriteEnabled: true,
            },
        });

        renderPipelineByKey.set(renderPipelineKey, renderPipeline);

        return renderPipeline;
    }

    #updateOrCreateBatchRecord(
        batch: RenderBatch,
        vertexBuffers: GPUBuffer[],
        indexBuffer: GPUBuffer | null,
        renderPipeline: GPURenderPipeline,
    ) {
        let batchRecord = this.#batchRecords.get(batch) ?? null;

        if (batchRecord === null) {
            batchRecord = {
                renderPipeline,
                vertexBuffers,
                indexBuffer: null,
                indexFormat: null,
                drawCount: 0,
            };

            this.#batchRecords.set(batch, batchRecord);
        }

        batchRecord.vertexBuffers = vertexBuffers;
        batchRecord.renderPipeline = renderPipeline;

        const indexArray = getGeometryIndexArray(batch.geometry);

        if (indexArray !== null && indexBuffer !== null) {
            batchRecord.indexBuffer = indexBuffer;
            batchRecord.indexFormat = indexArray instanceof Uint16Array ? 'uint16' : 'uint32';
            batchRecord.drawCount = indexArray.length;
        }
        else {
            batchRecord.indexBuffer = null;
            batchRecord.indexFormat = null;
            batchRecord.drawCount = batch.geometry.vertexCount;
        }

        return batchRecord;
    }
}

export { RendererPreparePhase };
