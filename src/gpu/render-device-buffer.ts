/**
 * A wrapper of a WebGPU buffer that belongs to a render device and can change its size.
 */
class RenderDeviceBuffer {
    /**
     * Creates a render device buffer with the given size and usage flags.
     *
     * @param gpuDevice - The WebGPU device that owns the buffer.
     * @param size - The size of the buffer.
     * @param usage - The usage flags to add to those required for writing.
     *
     * @remarks The size is in bytes.
     */
    static create(gpuDevice: GPUDevice, size: number, usage: GPUBufferUsageFlags) {
        const gpuBuffer = gpuDevice.createBuffer({ size, usage: GPUBufferUsage.COPY_DST | usage });

        return new RenderDeviceBuffer(gpuDevice, gpuBuffer);
    }

    /**
     * Creates a render device buffer with the given data and usage flags.
     *
     * @param gpuDevice - The WebGPU device that owns the buffer.
     * @param data - The initial contents of the buffer.
     * @param usage - The usage flags to add to those required for writing.
     *
     * @remarks The size of the buffer is the byte length of the data rounded up to a multiple of 4.
     */
    static createWithData(gpuDevice: GPUDevice, data: ArrayBufferView, usage: GPUBufferUsageFlags) {
        const gpuBufferSize = 4 * Math.ceil(data.byteLength / 4);

        const gpuBuffer = gpuDevice.createBuffer({
            size: gpuBufferSize,
            usage: GPUBufferUsage.COPY_DST | usage,
            mappedAtCreation: true,
        });

        const gpuBufferMappedRange = gpuBuffer.getMappedRange();
        const gpuBufferMappedRangeView = new Uint8Array(gpuBufferMappedRange);

        gpuBufferMappedRangeView.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

        gpuBuffer.unmap();

        return new RenderDeviceBuffer(gpuDevice, gpuBuffer);
    }

    #gpuDevice: GPUDevice;
    #gpuBuffer: GPUBuffer;

    #version: number;

    /**
     * Creates a render device buffer with the given WebGPU device and WebGPU buffer.
     *
     * @param gpuDevice - The WebGPU device that owns the buffer.
     * @param gpuBuffer - The WebGPU buffer to wrap.
     */
    constructor(gpuDevice: GPUDevice, gpuBuffer: GPUBuffer) {
        this.#gpuDevice = gpuDevice;
        this.#gpuBuffer = gpuBuffer;

        this.#version = 0;
    }

    /**
     * The current WebGPU buffer of this render device buffer.
     *
     * @remarks A resize replaces this object, and `version` reveals such a replacement.
     */
    get raw() {
        return this.#gpuBuffer;
    }

    /**
     * The counter that increases each time the WebGPU buffer of this render device buffer is replaced.
     *
     * @remarks Two readings that differ indicate that a retained WebGPU buffer is invalid.
     */
    get version() {
        return this.#version;
    }

    /**
     * Writes the given data into this render device buffer.
     *
     * @param data - The data to write.
     * @param bufferOffset - The position in this buffer to write to.
     * @param dataOffset - The position in the data to read from.
     *
     * @remarks The buffer offset is in bytes.
     * @remarks The data offset is in elements for a typed array and in bytes for a `DataView`.
     * @remarks The buffer offset and the number of written bytes are multiples of 4.
     */
    write(data: ArrayBufferView, bufferOffset: number, dataOffset = 0) {
        this.#gpuDevice.queue.writeBuffer(this.#gpuBuffer, bufferOffset, data, dataOffset);
    }

    /**
     * Sets this render device buffer to the given size.
     *
     * @param size - The new size.
     *
     * @remarks The size is in bytes.
     * @remarks A change of the size discards the contents and increases `version`.
     * @remarks The current size leaves this buffer unchanged.
     */
    resize(size: number) {
        if (this.#gpuBuffer.size === size) {
            return;
        }

        const usage = this.#gpuBuffer.usage;

        this.destroy();

        this.#gpuBuffer = this.#gpuDevice.createBuffer({ size, usage });

        this.#version++;
    }

    /**
     * Destroys this render device buffer and releases its GPU memory.
     */
    destroy() {
        this.#gpuBuffer.destroy();
    }
}

export { RenderDeviceBuffer };
