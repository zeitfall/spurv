/**
 * A wrapper of a WebGPU texture that belongs to a render device and can change its size.
 */
class RenderDeviceTexture {
    /**
     * Creates a render device texture with the given descriptor.
     *
     * @param gpuDevice - The WebGPU device that owns the texture.
     * @param descriptor - The description of the texture.
     */
    static create(gpuDevice: GPUDevice, descriptor: GPUTextureDescriptor) {
        const gpuTexture = gpuDevice.createTexture(descriptor);

        return new RenderDeviceTexture(gpuDevice, gpuTexture);
    }

    #gpuDevice: GPUDevice;
    #gpuTexture: GPUTexture;
    #gpuTextureView: GPUTextureView;

    #version: number;

    /**
     * Creates a render device texture with the given WebGPU device and WebGPU texture.
     *
     * @param gpuDevice - The WebGPU device that owns the texture.
     * @param gpuTexture - The WebGPU texture to wrap.
     */
    constructor(gpuDevice: GPUDevice, gpuTexture: GPUTexture) {
        this.#gpuDevice = gpuDevice;
        this.#gpuTexture = gpuTexture;
        this.#gpuTextureView = gpuTexture.createView();

        this.#version = 0;
    }

    /**
     * The current WebGPU texture of this render device texture.
     *
     * @remarks A resize replaces this object, and `version` reveals such a replacement.
     */
    get raw() {
        return this.#gpuTexture;
    }

    /**
     * The default view of the current WebGPU texture of this render device texture.
     *
     * @remarks A resize replaces this object, and `version` reveals such a replacement.
     */
    get view() {
        return this.#gpuTextureView;
    }

    /**
     * The counter that increases each time the WebGPU texture of this render device texture is replaced.
     *
     * @remarks Two readings that differ indicate that a retained WebGPU texture or view is invalid.
     */
    get version() {
        return this.#version;
    }

    /**
     * Sets this render device texture to the given width and height.
     *
     * @param width - The new width.
     * @param height - The new height.
     *
     * @remarks The width and the height are in texels.
     * @remarks A change of the size discards the contents and increases `version`.
     * @remarks The current size leaves this texture unchanged.
     */
    resize(width: number, height: number) {
        if (this.#gpuTexture.width === width && this.#gpuTexture.height === height) {
            return;
        }

        const descriptor: GPUTextureDescriptor = {
            size: [width, height, this.#gpuTexture.depthOrArrayLayers],
            dimension: this.#gpuTexture.dimension,
            format: this.#gpuTexture.format,
            usage: this.#gpuTexture.usage,
            sampleCount: this.#gpuTexture.sampleCount,
            mipLevelCount: this.#gpuTexture.mipLevelCount,
        };

        this.destroy();

        this.#gpuTexture = this.#gpuDevice.createTexture(descriptor);
        this.#gpuTextureView = this.#gpuTexture.createView();

        this.#version++;
    }

    /**
     * Destroys this render device texture and releases its GPU memory.
     */
    destroy() {
        this.#gpuTexture.destroy();
    }
}

export { RenderDeviceTexture };
