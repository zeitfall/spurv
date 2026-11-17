import type {
    RenderFramePacket,
    RenderFrameResources,
    RenderFrameDrawList,
} from './types.ts';

/**
 * A phase of a frame that orders the draws of the frame by render pipeline and by batch.
 */
class RendererQueuePhase {
    #renderPipelineToBatchCount: Map<GPURenderPipeline, number>;
    #sortedBatchIndices: number[];

    #batchIndexToMeshCount: number[];
    #batchIndexToDrawOffset: number[];

    #frameDrawList: RenderFrameDrawList;

    /**
     * Creates a queue phase.
     */
    constructor() {
        this.#renderPipelineToBatchCount = new Map();
        this.#sortedBatchIndices = [];

        this.#batchIndexToMeshCount = [];
        this.#batchIndexToDrawOffset = [];

        this.#frameDrawList = {
            drawCount: 0,
            drawIndexToMeshIndex: [],
            drawIndexToBatchIndex: [],
        };
    }

    /**
     * Updates the frame draw list for the current frame from the given frame packet and frame resources.
     *
     * @param framePacket - The frame packet of the current frame.
     * @param frameResources - The frame resources of the current frame.
     *
     * @returns The frame draw list of this queue phase.
     *
     * @remarks The frame draw list is valid until the next call.
     */
    execute(framePacket: RenderFramePacket, frameResources: RenderFrameResources) {
        this.#sortBatches(frameResources);
        this.#sortMeshes(framePacket);

        return this.#frameDrawList;
    }

    // Step 1: a counting sort of the batches, in which the render pipelines are the buckets.
    #sortBatches(frameResources: RenderFrameResources) {
        this.#renderPipelineToBatchCount.clear();
        this.#sortedBatchIndices.length = 0;

        // Counts the batches of each render pipeline.
        for (const batchRecord of frameResources.batchRecords) {
            const renderPipelineBatchCount = this.#renderPipelineToBatchCount.get(batchRecord.renderPipeline) ?? 0;

            this.#renderPipelineToBatchCount.set(batchRecord.renderPipeline, renderPipelineBatchCount + 1);
        }

        let precedingBatchCount = 0;

        // Replaces each count with the position at which the batches of its render pipeline begin.
        for (const [renderPipeline, renderPipelineBatchCount] of this.#renderPipelineToBatchCount) {
            this.#renderPipelineToBatchCount.set(renderPipeline, precedingBatchCount);

            precedingBatchCount += renderPipelineBatchCount;
        }

        const batchCount = frameResources.batchRecords.length;

        // Places each batch at the next free position of its render pipeline.
        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
            const batchRecord = frameResources.batchRecords[batchIndex];
            const batchOffset = this.#renderPipelineToBatchCount.get(batchRecord.renderPipeline) ?? 0;

            this.#sortedBatchIndices[batchOffset] = batchIndex;
            this.#renderPipelineToBatchCount.set(batchRecord.renderPipeline, batchOffset + 1);
        }
    }

    // Step 2: a counting sort of the meshes, in which the batches are the buckets, taken in the order of step 1.
    #sortMeshes(framePacket: RenderFramePacket) {
        this.#batchIndexToMeshCount.length = this.#sortedBatchIndices.length;
        this.#batchIndexToMeshCount.fill(0);

        const meshCount = framePacket.meshCount;

        // Counts the meshes of each batch.
        for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
            const batchIndex = framePacket.meshIndexToBatchIndex[meshIndex];

            this.#batchIndexToMeshCount[batchIndex]++;
        }

        let precedingMeshCount = 0;

        // Computes the position at which the meshes of each batch begin, visiting the batches in sorted order.
        for (const batchIndex of this.#sortedBatchIndices) {
            this.#batchIndexToDrawOffset[batchIndex] = precedingMeshCount;

            precedingMeshCount += this.#batchIndexToMeshCount[batchIndex];
        }

        // Places each mesh at the next free position of its batch.
        for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
            const batchIndex = framePacket.meshIndexToBatchIndex[meshIndex];
            const drawIndex = this.#batchIndexToDrawOffset[batchIndex];

            this.#frameDrawList.drawIndexToMeshIndex[drawIndex] = meshIndex;
            this.#frameDrawList.drawIndexToBatchIndex[drawIndex] = batchIndex;
            this.#batchIndexToDrawOffset[batchIndex] = drawIndex + 1;
        }

        this.#frameDrawList.drawCount = meshCount;
    }
}

export { RendererQueuePhase };
