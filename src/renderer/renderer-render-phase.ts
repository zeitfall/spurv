import type { RenderDevice, RenderDeviceTexture } from '../gpu/index.ts';

import type { RenderFrameResources, RenderFrameDrawList } from './types.ts';

/**
 * A phase of a frame that draws the frame to the canvas from its frame resources and its frame draw list.
 */
class RendererRenderPhase {
    #renderDevice: RenderDevice;
    #canvasContext: GPUCanvasContext;

    #colorAttachment: GPURenderPassColorAttachment;
    #depthTexture: RenderDeviceTexture;
    #depthStencilAttachment: GPURenderPassDepthStencilAttachment;
    #renderPassDescriptor: GPURenderPassDescriptor;

    #boundVertexBuffers: GPUBuffer[];

    /**
     * Creates a render phase with the given render device and canvas context.
     *
     * @param renderDevice - The render device that creates the depth texture and receives the commands.
     * @param canvasContext - The WebGPU context of the canvas to draw to.
     *
     * @remarks A canvas without area receives a depth texture of one texel on each side that it lacks.
     */
    constructor(renderDevice: RenderDevice, canvasContext: GPUCanvasContext) {
        this.#renderDevice = renderDevice;
        this.#canvasContext = canvasContext;

        const canvasElement = canvasContext.canvas;

        this.#colorAttachment = {
            // @ts-expect-error TS2322: The texture of the canvas exists only within a frame, which assigns its view.
            view: null,
            clearValue: [1, 1, 1, 1],
            loadOp: 'clear',
            storeOp: 'store',
        };

        this.#depthTexture = renderDevice.createDepthTexture(
            Math.max(canvasElement.width, 1),
            Math.max(canvasElement.height, 1),
        );

        this.#depthStencilAttachment = {
            view: this.#depthTexture.view,
            depthClearValue: 0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        };

        this.#renderPassDescriptor = {
            colorAttachments: [this.#colorAttachment],
            depthStencilAttachment: this.#depthStencilAttachment,
        };

        this.#boundVertexBuffers = [];
    }

    /**
     * Submits the draws of the given frame draw list to the GPU, with the given frame resources.
     *
     * @param frameResources - The frame resources of the current frame.
     * @param frameDrawList - The frame draw list of the current frame.
     *
     * @remarks The depth texture takes the size of the canvas, which must have an area.
     */
    execute(frameResources: RenderFrameResources, frameDrawList: RenderFrameDrawList) {
        const canvasElement = this.#canvasContext.canvas;
        const canvasTextureView = this.#canvasContext.getCurrentTexture().createView();

        this.#depthTexture.resize(canvasElement.width, canvasElement.height);

        this.#colorAttachment.view = canvasTextureView;
        this.#depthStencilAttachment.view = this.#depthTexture.view;

        const commandEncoder = this.#renderDevice.createCommandEncoder();

        this.#encodeRenderPass(commandEncoder, frameResources, frameDrawList);

        this.#renderDevice.submitCommandBuffers(commandEncoder.finish());
    }

    #encodeRenderPass(
        commandEncoder: GPUCommandEncoder,
        frameResources: RenderFrameResources,
        frameDrawList: RenderFrameDrawList,
    ) {
        const renderPass = commandEncoder.beginRenderPass(this.#renderPassDescriptor);

        renderPass.setBindGroup(0, frameResources.cameraBindGroup);
        renderPass.setBindGroup(1, frameResources.meshBindGroup);

        this.#boundVertexBuffers.length = 0;

        let boundRenderPipeline: GPURenderPipeline | null = null;
        let boundIndexBuffer: GPUBuffer | null = null;

        const drawCount = frameDrawList.drawCount;

        for (let drawIndex = 0; drawIndex < drawCount; drawIndex++) {
            const meshIndex = frameDrawList.drawIndexToMeshIndex[drawIndex];
            const batchIndex = frameDrawList.drawIndexToBatchIndex[drawIndex];
            const batchRecord = frameResources.batchRecords[batchIndex];

            if (boundRenderPipeline !== batchRecord.renderPipeline) {
                renderPass.setPipeline(batchRecord.renderPipeline);

                boundRenderPipeline = batchRecord.renderPipeline;
            }

            const vertexBufferCount = batchRecord.vertexBuffers.length;

            for (let vertexBufferIndex = 0; vertexBufferIndex < vertexBufferCount; vertexBufferIndex++) {
                const vertexBuffer = batchRecord.vertexBuffers[vertexBufferIndex];

                if (this.#boundVertexBuffers[vertexBufferIndex] !== vertexBuffer) {
                    renderPass.setVertexBuffer(vertexBufferIndex, vertexBuffer);

                    this.#boundVertexBuffers[vertexBufferIndex] = vertexBuffer;
                }
            }

            if (batchRecord.indexBuffer === null || batchRecord.indexFormat === null) {
                renderPass.draw(batchRecord.drawCount, 1, 0, meshIndex);
            }
            else {
                if (boundIndexBuffer !== batchRecord.indexBuffer) {
                    renderPass.setIndexBuffer(batchRecord.indexBuffer, batchRecord.indexFormat);

                    boundIndexBuffer = batchRecord.indexBuffer;
                }

                renderPass.drawIndexed(batchRecord.drawCount, 1, 0, 0, meshIndex);
            }
        }

        renderPass.end();
    }
}

export { RendererRenderPhase };
