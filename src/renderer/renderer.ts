import {
    RenderDevice,
    RenderDeviceState,
    type RenderDeviceEventType,
    type RenderDeviceEventMap,
} from '../gpu/index.ts';

import type { Camera } from '../cameras/index.ts';

import type { Scene } from '../scene/index.ts';

import { RendererExtractPhase } from './renderer-extract-phase.ts';
import { RendererPreparePhase } from './renderer-prepare-phase.ts';
import { RendererQueuePhase } from './renderer-queue-phase.ts';
import { RendererRenderPhase } from './renderer-render-phase.ts';

/**
 * A renderer that draws a scene to a canvas.
 */
class Renderer {
    /**
     * Creates a renderer with the given canvas.
     *
     * @param canvasElement - The canvas to render to.
     *
     * @throws Error if WebGPU, a GPU adapter, or a WebGPU context of the given canvas is unavailable.
     */
    static async create(canvasElement: HTMLCanvasElement) {
        const renderDevice = await RenderDevice.create();
        const canvasContext = renderDevice.createCanvasContext(canvasElement);

        return new Renderer(renderDevice, canvasContext);
    }

    #renderDevice: RenderDevice;
    #canvasContext: GPUCanvasContext;

    #extractPhase: RendererExtractPhase;
    #preparePhase: RendererPreparePhase;
    #queuePhase: RendererQueuePhase;
    #renderPhase: RendererRenderPhase;

    /**
     * Creates a renderer with the given render device and canvas context.
     *
     * @param renderDevice - The render device of the renderer.
     * @param canvasContext - The WebGPU context of the canvas to render to.
     */
    constructor(renderDevice: RenderDevice, canvasContext: GPUCanvasContext) {
        this.#renderDevice = renderDevice;
        this.#canvasContext = canvasContext;

        this.#extractPhase = new RendererExtractPhase();
        this.#preparePhase = new RendererPreparePhase(renderDevice);
        this.#queuePhase = new RendererQueuePhase();
        this.#renderPhase = new RendererRenderPhase(renderDevice, canvasContext);
    }

    /**
     * The largest width and the largest height of a canvas that this renderer supports.
     *
     * @remarks The size is in pixels.
     */
    get maxCanvasSizePerDimension() {
        return this.#renderDevice.limits.maxTextureDimension2D;
    }

    /**
     * Appends the given listener to the listeners of the given event type.
     *
     * @typeParam T - The event type.
     *
     * @param eventType - The event type to listen to.
     * @param eventListener - The listener to append.
     * @param eventListenerOptions - The options of the listener.
     *
     * @remarks `devicelost` reports an unexpected loss of the device.
     * @remarks `uncapturederror` reports a GPU error that no other code has handled.
     * @remarks `compilationerror` reports a problem in the source code of a shader.
     */
    addEventListener<T extends RenderDeviceEventType>(
        eventType: T,
        eventListener: (event: RenderDeviceEventMap[T]) => void,
        eventListenerOptions: EventListenerOptions = {},
    ) {
        this.#renderDevice.addEventListener(
            eventType,
            eventListener,
            eventListenerOptions,
        );
    }

    /**
     * Removes the given listener from the listeners of the given event type.
     *
     * @typeParam T - The event type.
     *
     * @param eventType - The event type to stop listening to.
     * @param eventListener - The listener to remove.
     * @param eventListenerOptions - The options of the listener.
     */
    removeEventListener<T extends RenderDeviceEventType>(
        eventType: T,
        eventListener: (event: RenderDeviceEventMap[T]) => void,
        eventListenerOptions: EventListenerOptions = {},
    ) {
        this.#renderDevice.removeEventListener(
            eventType,
            eventListener,
            eventListenerOptions,
        );
    }

    /**
     * Updates the canvas of this renderer from the given scene and camera.
     *
     * @param scene - The scene to draw.
     * @param camera - The camera through which the scene is viewed.
     *
     * @throws Error if this renderer is destroyed, or if a geometry of the scene lacks a vertex attribute that
     * the shader of its material requires.
     *
     * @remarks A renderer that has lost its device draws nothing.
     * @remarks A canvas without area is left unchanged.
     */
    render(scene: Scene, camera: Camera) {
        const renderDevice = this.#renderDevice;
        const renderDeviceState = renderDevice.state;

        if (renderDeviceState === RenderDeviceState.DESTROYED) {
            throw new Error('Renderer.render: expected an active renderer, received a destroyed renderer.');
        }

        if (renderDeviceState === RenderDeviceState.LOST) {
            return;
        }

        const canvasElement = this.#canvasContext.canvas;
        const canvasWidth = canvasElement.width;
        const canvasHeight = canvasElement.height;

        if (canvasWidth === 0 || canvasHeight === 0) {
            return;
        }

        const canvasAspectRatio = canvasWidth / canvasHeight;

        const framePacket = this.#extractPhase.execute(scene, camera, canvasAspectRatio);
        const frameResources = this.#preparePhase.execute(framePacket);
        const frameDrawList = this.#queuePhase.execute(framePacket, frameResources);

        this.#renderPhase.execute(frameResources, frameDrawList);
    }

    /**
     * Destroys this renderer and releases its GPU resources.
     */
    destroy() {
        this.#renderDevice.destroy();
    }
}

export { Renderer };
