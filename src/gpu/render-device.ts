import { RenderDeviceBuffer } from './render-device-buffer.ts';
import { RenderDeviceTexture } from './render-device-texture.ts';

const RenderDeviceEventType = {
    DEVICE_LOST: 'devicelost',
    UNCAPTURED_ERROR: 'uncapturederror',
    COMPILATION_ERROR: 'compilationerror',
} as const;

interface RenderDeviceOptions {
    adapterOptions?: GPURequestAdapterOptions;
    deviceDescriptor?: GPUDeviceDescriptor;
}

interface RenderDeviceEventMap {
    [RenderDeviceEventType.DEVICE_LOST]: CustomEvent<GPUDeviceLostInfo>;
    [RenderDeviceEventType.UNCAPTURED_ERROR]: CustomEvent<GPUError>;
    [RenderDeviceEventType.COMPILATION_ERROR]: CustomEvent<GPUCompilationInfo>;
}

/**
 * A connection to the GPU that creates GPU resources and reports GPU errors.
 */
class RenderDevice {
    /**
     * Creates a render device with the given options.
     *
     * @param options - The settings of the adapter and the device.
     *
     * @throws Error if WebGPU or a GPU adapter is unavailable.
     */
    static async create(options: RenderDeviceOptions = {}) {
        const gpu = navigator.gpu;

        if (gpu === undefined || gpu === null) {
            throw new Error('RenderDevice.create: expected an environment with WebGPU, received an environment without it.');
        }

        const gpuAdapter = await gpu.requestAdapter(options.adapterOptions);

        if (gpuAdapter === null) {
            throw new Error('RenderDevice.create: expected a GPU adapter, received null.');
        }

        const gpuDevice = await gpuAdapter.requestDevice(options.deviceDescriptor);

        return new RenderDevice(gpuDevice);
    }

    #gpuDevice: GPUDevice;

    #eventTarget: EventTarget;

    /**
     * Creates a render device with the given WebGPU device.
     *
     * @param gpuDevice - The WebGPU device to wrap.
     */
    constructor(gpuDevice: GPUDevice) {
        this.#gpuDevice = gpuDevice;

        this.#eventTarget = new EventTarget();

        gpuDevice.lost.then((info) => this.#handleDeviceLost(info));
        gpuDevice.addEventListener('uncapturederror', (event) => this.#handleUncapturedError(event));
    }

    /**
     * The limits of this render device.
     */
    get limits() {
        return this.#gpuDevice.limits;
    }

    // Events -----------------------------------------------------------------

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
    addEventListener<
        T extends typeof RenderDeviceEventType[keyof typeof RenderDeviceEventType],
    >(
        eventType: T,
        eventListener: (event: RenderDeviceEventMap[T]) => void,
        eventListenerOptions: EventListenerOptions = {},
    ) {
        this.#eventTarget.addEventListener(
            eventType,
            eventListener as EventListener,
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
    removeEventListener<
        T extends typeof RenderDeviceEventType[keyof typeof RenderDeviceEventType],
    >(
        eventType: T,
        eventListener: (event: RenderDeviceEventMap[T]) => void,
        eventListenerOptions: EventListenerOptions = {},
    ) {
        this.#eventTarget.removeEventListener(
            eventType,
            eventListener as EventListener,
            eventListenerOptions,
        );
    }

    // Canvas -----------------------------------------------------------------

    /**
     * Creates a WebGPU context of the given canvas with the given configuration.
     *
     * @param canvasElement - The canvas to render to.
     * @param canvasConfiguration - The configuration of the context.
     *
     * @throws Error if the given canvas provides no WebGPU context.
     */
    createCanvasContext(
        canvasElement: HTMLCanvasElement,
        canvasConfiguration: Omit<GPUCanvasConfiguration, 'device'>,
    ) {
        const canvasContext = canvasElement.getContext('webgpu');

        if (canvasContext === null) {
            throw new Error('RenderDevice.createCanvasContext: expected a canvas that provides a WebGPU context, received a canvas that does not.');
        }

        canvasContext.configure({ ...canvasConfiguration, device: this.#gpuDevice });

        return canvasContext;
    }

    // Buffers ----------------------------------------------------------------

    /**
     * Creates a vertex buffer with the given size.
     *
     * @param size - The size of the buffer.
     *
     * @remarks The size is in bytes.
     */
    createVertexBuffer(size: number) {
        return RenderDeviceBuffer.create(this.#gpuDevice, size, GPUBufferUsage.VERTEX);
    }

    /**
     * Creates a vertex buffer with the given data.
     *
     * @param data - The initial contents of the buffer.
     *
     * @remarks The size of the buffer is the byte length of the data rounded up to a multiple of 4.
     */
    createVertexBufferWithData(data: ArrayBufferView) {
        return RenderDeviceBuffer.createWithData(this.#gpuDevice, data, GPUBufferUsage.VERTEX);
    }

    /**
     * Creates an index buffer with the given size.
     *
     * @param size - The size of the buffer.
     *
     * @remarks The size is in bytes.
     */
    createIndexBuffer(size: number) {
        return RenderDeviceBuffer.create(this.#gpuDevice, size, GPUBufferUsage.INDEX);
    }

    /**
     * Creates an index buffer with the given data.
     *
     * @param data - The initial contents of the buffer.
     *
     * @remarks The size of the buffer is the byte length of the data rounded up to a multiple of 4.
     */
    createIndexBufferWithData(data: ArrayBufferView) {
        return RenderDeviceBuffer.createWithData(this.#gpuDevice, data, GPUBufferUsage.INDEX);
    }

    /**
     * Creates a uniform buffer with the given size.
     *
     * @param size - The size of the buffer.
     *
     * @remarks The size is in bytes.
     */
    createUniformBuffer(size: number) {
        return RenderDeviceBuffer.create(this.#gpuDevice, size, GPUBufferUsage.UNIFORM);
    }

    /**
     * Creates a uniform buffer with the given data.
     *
     * @param data - The initial contents of the buffer.
     *
     * @remarks The size of the buffer is the byte length of the data rounded up to a multiple of 4.
     */
    createUniformBufferWithData(data: ArrayBufferView) {
        return RenderDeviceBuffer.createWithData(this.#gpuDevice, data, GPUBufferUsage.UNIFORM);
    }

    // Textures ---------------------------------------------------------------

    /**
     * Creates a depth texture with the given width and height.
     *
     * @param width - The width of the texture.
     * @param height - The height of the texture.
     *
     * @remarks The width and the height are in texels.
     */
    createDepthTexture(width: number, height: number) {
        return RenderDeviceTexture.create(this.#gpuDevice, {
            size: [width, height],
            format: 'depth32float',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
    }

    // Pipelines --------------------------------------------------------------

    /**
     * Creates a shader module with the given WGSL source code.
     *
     * @param shaderCode - The WGSL source code.
     *
     * @remarks A problem in the source code is reported by a `compilationerror` event after this method
     * returns.
     */
    createShaderModule(shaderCode: string) {
        const shaderModule = this.#gpuDevice.createShaderModule({ code: shaderCode });

        shaderModule.getCompilationInfo().then((info) => this.#handleCompilationError(info));

        return shaderModule;
    }

    /**
     * Creates a bind group layout with the given descriptor.
     *
     * @param descriptor - The description of the bind group layout.
     */
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor) {
        return this.#gpuDevice.createBindGroupLayout(descriptor);
    }

    /**
     * Creates a bind group with the given descriptor.
     *
     * @param descriptor - The description of the bind group.
     */
    createBindGroup(descriptor: GPUBindGroupDescriptor) {
        return this.#gpuDevice.createBindGroup(descriptor);
    }

    /**
     * Creates a pipeline layout with the given descriptor.
     *
     * @param descriptor - The description of the pipeline layout.
     */
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor) {
        return this.#gpuDevice.createPipelineLayout(descriptor);
    }

    /**
     * Creates a render pipeline with the given descriptor.
     *
     * @param descriptor - The description of the render pipeline.
     */
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor) {
        return this.#gpuDevice.createRenderPipeline(descriptor);
    }

    // Commands ---------------------------------------------------------------

    /**
     * Creates a command encoder with the given descriptor.
     *
     * @param descriptor - The description of the command encoder.
     */
    createCommandEncoder(descriptor: GPUCommandEncoderDescriptor = {}) {
        return this.#gpuDevice.createCommandEncoder(descriptor);
    }

    /**
     * Submits the given command buffers to the queue of this render device.
     *
     * @param buffers - The command buffers to submit, in the order of their execution.
     */
    submitCommandBuffers(...buffers: GPUCommandBuffer[]) {
        this.#gpuDevice.queue.submit(buffers);
    }

    // Lifecycle --------------------------------------------------------------

    /**
     * Destroys this render device and releases its GPU resources.
     *
     * @remarks This method does not cause a `devicelost` event.
     */
    destroy() {
        this.#gpuDevice.destroy();
    }

    // Private ----------------------------------------------------------------

    #handleDeviceLost(info: GPUDeviceLostInfo) {
        if (info.reason === 'destroyed') {
            return;
        }

        const gpuDeviceLostEvent = new CustomEvent<GPUDeviceLostInfo>(
            RenderDeviceEventType.DEVICE_LOST,
            { detail: info },
        );

        this.#eventTarget.dispatchEvent(gpuDeviceLostEvent);
    }

    #handleUncapturedError(event: GPUUncapturedErrorEvent) {
        const uncapturedErrorEvent = new CustomEvent<GPUError>(
            RenderDeviceEventType.UNCAPTURED_ERROR,
            { detail: event.error },
        );

        this.#eventTarget.dispatchEvent(uncapturedErrorEvent);
    }

    #handleCompilationError(info: GPUCompilationInfo) {
        const compilationErrorMessages = info.messages.filter((message) => message.type === 'error');

        if (compilationErrorMessages.length > 0) {
            const compilationErrorInfo: GPUCompilationInfo = {
                ...info,
                messages: compilationErrorMessages,
            };

            const compilationErrorEvent = new CustomEvent<GPUCompilationInfo>(
                RenderDeviceEventType.COMPILATION_ERROR,
                { detail: compilationErrorInfo },
            );

            this.#eventTarget.dispatchEvent(compilationErrorEvent);
        }
    }
}

export { RenderDevice };
