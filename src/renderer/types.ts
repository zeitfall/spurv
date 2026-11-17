import type { Geometry } from '../geometry/index.ts';

import type { Material } from '../materials/index.ts';

/**
 * A combination of a geometry and a material that the meshes of a frame share.
 */
interface RenderBatch {
    /**
     * The position of the batch among the batches of the current frame.
     */
    index: number;

    /**
     * The geometry of the batch.
     */
    geometry: Geometry;

    /**
     * The material of the batch.
     */
    material: Material;

    /**
     * The frame in which the index of the batch was last assigned.
     */
    updatedAtFrame: number;
}

/**
 * A record of the GPU objects and the draw parameters with which the meshes of one batch are drawn.
 */
interface RenderBatchRecord {
    /**
     * The render pipeline of the batch.
     */
    renderPipeline: GPURenderPipeline;

    /**
     * The vertex buffers of the batch, in the order of the vertex attributes that its shader requires.
     */
    vertexBuffers: GPUBuffer[];

    /**
     * The index buffer of the batch, or `null` when its geometry has no indices.
     */
    indexBuffer: GPUBuffer | null;

    /**
     * The format of the indices of the batch, or `null` when its geometry has no indices.
     */
    indexFormat: GPUIndexFormat | null;

    /**
     * The number of indices of the batch, or the number of its vertices when its geometry has no indices.
     */
    drawCount: number;
}

/**
 * The data of one frame that the extract phase collects from a scene and a camera.
 */
interface RenderFramePacket {
    /**
     * The components of the view-projection matrix of the camera.
     */
    cameraViewProjectionArray: Float32Array;

    /**
     * The number of meshes in the frame.
     */
    meshCount: number;

    /**
     * The components of the world matrices of the meshes, 16 for each mesh in the order of the mesh indices.
     *
     * @remarks Only the matrices of the first `meshCount` meshes are valid.
     * @remarks A frame with more meshes than the array admits replaces the array with a larger one.
     */
    meshWorldMatrixArray: Float32Array;

    /**
     * The index of the batch of each mesh, at the index of that mesh.
     *
     * @remarks Only the elements of the first `meshCount` meshes are valid.
     */
    meshIndexToBatchIndex: number[];

    /**
     * The batches of the frame, each of which appears once.
     */
    batches: RenderBatch[];
}

/**
 * The GPU objects of one frame that the prepare phase creates and updates from a frame packet.
 */
interface RenderFrameResources {
    /**
     * The bind group that holds the data of the camera.
     */
    cameraBindGroup: GPUBindGroup;

    /**
     * The bind group that holds the data of the meshes.
     */
    meshBindGroup: GPUBindGroup;

    /**
     * The record of each batch of the frame, at the index of that batch.
     */
    batchRecords: RenderBatchRecord[];
}

/**
 * A list of the draws of one frame, in which the draws of one render pipeline are adjacent, and among them the
 * draws of one batch.
 */
interface RenderFrameDrawList {
    /**
     * The number of draws in the frame, one for each mesh.
     */
    drawCount: number;

    /**
     * The index of the mesh of each draw, at the index of that draw.
     *
     * @remarks Only the elements of the first `drawCount` draws are valid.
     */
    drawIndexToMeshIndex: number[];

    /**
     * The index of the batch of each draw, at the index of that draw.
     *
     * @remarks Only the elements of the first `drawCount` draws are valid.
     */
    drawIndexToBatchIndex: number[];
}

export type {
    RenderBatch,
    RenderBatchRecord,
    RenderFramePacket,
    RenderFrameResources,
    RenderFrameDrawList,
};
