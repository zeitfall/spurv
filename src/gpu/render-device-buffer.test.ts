import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { RenderDeviceBuffer } from './render-device-buffer.ts';

interface FakeBuffer {
    size: number;
    usage: number;
    mappedAtCreation: boolean;
    contents: number[];
    unmapCount: number;
    destroyCount: number;
    getMappedRange(): ArrayBuffer;
    unmap(): void;
    destroy(): void;
}

interface FakeWrite {
    buffer: FakeBuffer;
    bufferOffset: number;
    data: ArrayBufferView;
    dataOffset: number;
}

function createFakeDevice() {
    const buffers: FakeBuffer[] = [];
    const writes: FakeWrite[] = [];

    function createBuffer(descriptor: GPUBufferDescriptor) {
        const mappedRange = new ArrayBuffer(descriptor.size);

        const buffer: FakeBuffer = {
            size: descriptor.size,
            usage: descriptor.usage,
            mappedAtCreation: descriptor.mappedAtCreation === true,
            contents: [],
            unmapCount: 0,
            destroyCount: 0,
            getMappedRange: () => mappedRange,
            unmap() {
                buffer.contents = [...new Uint8Array(mappedRange)];
                buffer.unmapCount++;
            },
            destroy() {
                buffer.destroyCount++;
            },
        };

        buffers.push(buffer);

        return buffer;
    }

    function writeBuffer(buffer: FakeBuffer, bufferOffset: number, data: ArrayBufferView, dataOffset: number) {
        writes.push({ buffer, bufferOffset, data, dataOffset });
    }

    const gpuDevice = {
        createBuffer,
        queue: { writeBuffer },
    } as unknown as GPUDevice;

    return { gpuDevice, buffers, writes };
}

function createSubject(size: number) {
    const { gpuDevice, buffers, writes } = createFakeDevice();

    return {
        buffers,
        writes,
        subject: RenderDeviceBuffer.create(gpuDevice, size, GPUBufferUsage.VERTEX),
    };
}

function bufferAt(buffers: FakeBuffer[], index: number) {
    const buffer = buffers[index];

    assert.ok(buffer);

    return buffer;
}

function writeAt(writes: FakeWrite[], index: number) {
    const write = writes[index];

    assert.ok(write);

    return write;
}

describe('RenderDeviceBuffer', () => {
    before(() => {
        Object.assign(globalThis, {
            GPUBufferUsage: { COPY_DST: 8, INDEX: 16, VERTEX: 32 },
        });
    });

    after(() => {
        Reflect.deleteProperty(globalThis, 'GPUBufferUsage');
    });

    describe('create()', () => {
        it('creates an unmapped buffer of the given size', () => {
            const { buffers } = createSubject(64);

            assert.equal(bufferAt(buffers, 0).size, 64);
            assert.equal(bufferAt(buffers, 0).mappedAtCreation, false);
        });

        it('adds the usage required for writing to the given usage flags', () => {
            const { buffers } = createSubject(64);

            assert.equal(bufferAt(buffers, 0).usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        });

        it('keeps a size that is not a multiple of 4', () => {
            const { buffers } = createSubject(6);

            assert.equal(bufferAt(buffers, 0).size, 6);
        });
    });

    describe('createWithData()', () => {
        it('creates a mapped buffer of the byte length of the data', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint32Array(2), GPUBufferUsage.VERTEX);

            assert.equal(bufferAt(buffers, 0).size, 8);
            assert.equal(bufferAt(buffers, 0).mappedAtCreation, true);
        });

        it('rounds the size up to a multiple of 4', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint16Array(3), GPUBufferUsage.INDEX);

            assert.equal(bufferAt(buffers, 0).size, 8);
        });

        it('adds the usage required for writing to the given usage flags', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint32Array(1), GPUBufferUsage.INDEX);

            assert.equal(bufferAt(buffers, 0).usage, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);
        });

        it('copies the data into the buffer before it is unmapped', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint8Array([1, 2, 3, 4]), GPUBufferUsage.VERTEX);

            assert.deepEqual(bufferAt(buffers, 0).contents, [1, 2, 3, 4]);
        });

        it('copies only the bytes of a view into a larger array', () => {
            const { gpuDevice, buffers } = createFakeDevice();
            const source = new Uint8Array([9, 9, 1, 2, 3, 4, 9, 9]);

            RenderDeviceBuffer.createWithData(gpuDevice, source.subarray(2, 6), GPUBufferUsage.VERTEX);

            assert.deepEqual(bufferAt(buffers, 0).contents, [1, 2, 3, 4]);
        });

        it('leaves the padding bytes at zero', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint8Array([1, 2, 3, 4, 5]), GPUBufferUsage.VERTEX);

            assert.deepEqual(bufferAt(buffers, 0).contents, [1, 2, 3, 4, 5, 0, 0, 0]);
        });

        it('unmaps the buffer once', () => {
            const { gpuDevice, buffers } = createFakeDevice();

            RenderDeviceBuffer.createWithData(gpuDevice, new Uint32Array(1), GPUBufferUsage.VERTEX);

            assert.equal(bufferAt(buffers, 0).unmapCount, 1);
        });
    });

    describe('raw', () => {
        it('returns the wrapped WebGPU buffer', () => {
            const { buffers, subject } = createSubject(64);

            assert.equal(subject.raw, bufferAt(buffers, 0));
        });
    });

    describe('version', () => {
        it('starts at zero', () => {
            const { subject } = createSubject(64);

            assert.equal(subject.version, 0);
        });
    });

    describe('write()', () => {
        it('writes the data at the given buffer offset', () => {
            const { buffers, writes, subject } = createSubject(64);
            const data = new Uint32Array(1);

            subject.write(data, 4);

            assert.equal(writeAt(writes, 0).buffer, bufferAt(buffers, 0));
            assert.equal(writeAt(writes, 0).bufferOffset, 4);
            assert.equal(writeAt(writes, 0).data, data);
        });

        it('reads the data from its start by default', () => {
            const { writes, subject } = createSubject(64);

            subject.write(new Uint32Array(1), 0);

            assert.equal(writeAt(writes, 0).dataOffset, 0);
        });

        it('reads the data from the given data offset', () => {
            const { writes, subject } = createSubject(64);

            subject.write(new Uint32Array(4), 0, 2);

            assert.equal(writeAt(writes, 0).dataOffset, 2);
        });

        it('writes into the replacement after a resize', () => {
            const { buffers, writes, subject } = createSubject(64);

            subject.resize(128);
            subject.write(new Uint32Array(1), 0);

            assert.equal(writeAt(writes, 0).buffer, bufferAt(buffers, 1));
        });

        it('leaves the version unchanged', () => {
            const { subject } = createSubject(64);

            subject.write(new Uint32Array(1), 0);

            assert.equal(subject.version, 0);
        });
    });

    describe('resize()', () => {
        it('replaces the buffer with a larger one of the given size', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(128);

            assert.equal(bufferAt(buffers, 1).size, 128);
            assert.equal(subject.raw, bufferAt(buffers, 1));
        });

        it('replaces the buffer with a smaller one of the given size', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(32);

            assert.equal(bufferAt(buffers, 1).size, 32);
            assert.equal(subject.raw, bufferAt(buffers, 1));
        });

        it('retains the usage flags of the previous buffer', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(128);

            assert.equal(bufferAt(buffers, 1).usage, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
        });

        it('creates an unmapped replacement of a buffer created with data', () => {
            const { gpuDevice, buffers } = createFakeDevice();
            const subject = RenderDeviceBuffer.createWithData(gpuDevice, new Uint32Array(1), GPUBufferUsage.VERTEX);

            subject.resize(128);

            assert.equal(bufferAt(buffers, 1).mappedAtCreation, false);
        });

        it('destroys only the previous buffer', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(128);

            assert.equal(bufferAt(buffers, 0).destroyCount, 1);
            assert.equal(bufferAt(buffers, 1).destroyCount, 0);
        });

        it('increases the version once per replacement', () => {
            const { subject } = createSubject(64);

            subject.resize(128);
            subject.resize(256);

            assert.equal(subject.version, 2);
        });

        it('leaves the buffer and the version unchanged at the current size', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(64);

            assert.equal(buffers.length, 1);
            assert.equal(bufferAt(buffers, 0).destroyCount, 0);
            assert.equal(subject.raw, bufferAt(buffers, 0));
            assert.equal(subject.version, 0);
        });

        it('compares against the rounded size of a buffer created with data', () => {
            const { gpuDevice, buffers } = createFakeDevice();
            const subject = RenderDeviceBuffer.createWithData(gpuDevice, new Uint16Array(3), GPUBufferUsage.INDEX);

            subject.resize(8);

            assert.equal(buffers.length, 1);
            assert.equal(subject.version, 0);
        });
    });

    describe('destroy()', () => {
        it('destroys the wrapped WebGPU buffer', () => {
            const { buffers, subject } = createSubject(64);

            subject.destroy();

            assert.equal(bufferAt(buffers, 0).destroyCount, 1);
        });

        it('destroys the replacement after a resize', () => {
            const { buffers, subject } = createSubject(64);

            subject.resize(128);
            subject.destroy();

            assert.equal(bufferAt(buffers, 0).destroyCount, 1);
            assert.equal(bufferAt(buffers, 1).destroyCount, 1);
        });
    });
});
