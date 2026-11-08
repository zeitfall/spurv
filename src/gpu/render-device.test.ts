import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';

import { RenderDevice } from './render-device.ts';

interface FakeCall {
    method: string;
    argument: unknown;
    result: object;
}

function settle() {
    return new Promise((resolve) => {
        setImmediate(resolve);
    });
}

function stubNavigatorGPU(gpu: object) {
    Object.defineProperty(navigator, 'gpu', { configurable: true, value: gpu });
}

function findCall(calls: FakeCall[], method: string) {
    const call = calls.find((candidate) => candidate.method === method);

    assert.ok(call);

    return call;
}

function createFakeDevice(compilationMessages: object[] = []) {
    const eventTarget = new EventTarget();
    const calls: FakeCall[] = [];

    let resolveLost: (info: GPUDeviceLostInfo) => void = () => {};

    const lost = new Promise<GPUDeviceLostInfo>((resolve) => {
        resolveLost = resolve;
    });

    function record(method: string) {
        return (argument: unknown) => {
            const result = { method };

            calls.push({ method, argument, result });

            return result;
        };
    }

    function createShaderModule(argument: unknown) {
        const result = {
            method: 'createShaderModule',
            getCompilationInfo: async () => ({ messages: compilationMessages }),
        };

        calls.push({ method: 'createShaderModule', argument, result });

        return result;
    }

    const gpuDevice = {
        limits: { maxTextureDimension2D: 8192 },
        lost,
        queue: { submit: record('submit') },
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        createBuffer: record('createBuffer'),
        createTexture: record('createTexture'),
        createBindGroupLayout: record('createBindGroupLayout'),
        createBindGroup: record('createBindGroup'),
        createPipelineLayout: record('createPipelineLayout'),
        createRenderPipeline: record('createRenderPipeline'),
        createCommandEncoder: record('createCommandEncoder'),
        createShaderModule,
        destroy: record('destroy'),
    } as unknown as GPUDevice;

    function loseDevice(reason: string) {
        resolveLost({ reason, message: 'lost' } as GPUDeviceLostInfo);
    }

    function emitUncapturedError(error: object) {
        eventTarget.dispatchEvent(Object.assign(new Event('uncapturederror'), { error }));
    }

    return {
        gpuDevice,
        device: new RenderDevice(gpuDevice),
        calls,
        loseDevice,
        emitUncapturedError,
    };
}

function createFakeCanvas(context: object | null) {
    return { getContext: () => context } as unknown as HTMLCanvasElement;
}

describe('RenderDevice', () => {
    before(() => {
        Object.assign(globalThis, {
            GPUBufferUsage: { COPY_SRC: 4, COPY_DST: 8, INDEX: 16, VERTEX: 32, UNIFORM: 64 },
            GPUTextureUsage: { TEXTURE_BINDING: 4, RENDER_ATTACHMENT: 16 },
        });
    });

    after(() => {
        Reflect.deleteProperty(globalThis, 'GPUBufferUsage');
        Reflect.deleteProperty(globalThis, 'GPUTextureUsage');
    });

    describe('create()', () => {
        afterEach(() => {
            Reflect.deleteProperty(navigator, 'gpu');
        });

        it('rejects in an environment without WebGPU', async () => {
            await assert.rejects(() => RenderDevice.create(), {
                name: 'Error',
                message: /^RenderDevice\.create: /,
            });
        });

        it('rejects when no adapter is available', async () => {
            stubNavigatorGPU({ requestAdapter: async () => null });

            await assert.rejects(() => RenderDevice.create(), {
                name: 'Error',
                message: /^RenderDevice\.create: /,
            });
        });

        it('passes the options to WebGPU unchanged and creates a device', async () => {
            const { gpuDevice } = createFakeDevice();
            const adapterOptions = { powerPreference: 'high-performance' } as const;
            const deviceDescriptor = { label: 'device' };
            const receivedAdapterOptions: unknown[] = [];
            const receivedDeviceDescriptors: unknown[] = [];

            stubNavigatorGPU({
                requestAdapter: async (options: unknown) => {
                    receivedAdapterOptions.push(options);

                    return {
                        requestDevice: async (descriptor: unknown) => {
                            receivedDeviceDescriptors.push(descriptor);

                            return gpuDevice;
                        },
                    };
                },
            });

            const device = await RenderDevice.create({ adapterOptions, deviceDescriptor });

            assert.equal(device instanceof RenderDevice, true);
            assert.equal(receivedAdapterOptions[0], adapterOptions);
            assert.equal(receivedDeviceDescriptors[0], deviceDescriptor);
        });

        it('propagates a rejection of the device request', async () => {
            const failure = new Error('unsupported feature');

            stubNavigatorGPU({
                requestAdapter: async () => ({
                    requestDevice: async () => {
                        throw failure;
                    },
                }),
            });

            await assert.rejects(() => RenderDevice.create(), failure);
        });
    });

    describe('limits', () => {
        it('exposes the limits of the WebGPU device', () => {
            const { gpuDevice, device } = createFakeDevice();

            assert.equal(device.limits, gpuDevice.limits);
        });
    });

    describe('addEventListener()', () => {
        it('reports an unexpected loss of the device', async () => {
            const { device, loseDevice } = createFakeDevice();
            const reasons: string[] = [];

            device.addEventListener('devicelost', (event) => {
                reasons.push(event.detail.reason);
            });

            loseDevice('unknown');
            await settle();

            assert.deepEqual(reasons, ['unknown']);
        });

        it('does not report a destruction as a loss', async () => {
            const { device, loseDevice } = createFakeDevice();
            const reasons: string[] = [];

            device.addEventListener('devicelost', (event) => {
                reasons.push(event.detail.reason);
            });

            loseDevice('destroyed');
            await settle();

            assert.deepEqual(reasons, []);
        });

        it('reports an uncaptured error with the error of WebGPU', () => {
            const { device, emitUncapturedError } = createFakeDevice();
            const error = { message: 'validation failed' };
            const details: unknown[] = [];

            device.addEventListener('uncapturederror', (event) => {
                details.push(event.detail);
            });

            emitUncapturedError(error);

            assert.equal(details.length, 1);
            assert.equal(details[0], error);
        });
    });

    describe('removeEventListener()', () => {
        it('stops the delivery of events to the listener', () => {
            const { device, emitUncapturedError } = createFakeDevice();
            const details: unknown[] = [];

            function listener(event: CustomEvent<GPUError>) {
                details.push(event.detail);
            }

            device.addEventListener('uncapturederror', listener);
            device.removeEventListener('uncapturederror', listener);

            emitUncapturedError({ message: 'validation failed' });

            assert.equal(details.length, 0);
        });
    });

    describe('createCanvasContext()', () => {
        it('configures the context with the device and returns it', () => {
            const { gpuDevice, device } = createFakeDevice();
            const configurations: unknown[] = [];
            const context = {
                configure: (configuration: unknown) => {
                    configurations.push(configuration);
                },
            };

            const result = device.createCanvasContext(createFakeCanvas(context), { format: 'bgra8unorm' });

            assert.equal(result, context);
            assert.deepEqual(configurations, [{ format: 'bgra8unorm', device: gpuDevice }]);
        });

        it('throws when the canvas provides no WebGPU context', () => {
            const { device } = createFakeDevice();

            assert.throws(() => device.createCanvasContext(createFakeCanvas(null), { format: 'bgra8unorm' }), {
                name: 'Error',
                message: /^RenderDevice\.createCanvasContext: /,
            });
        });
    });

    describe('createVertexBuffer()', () => {
        it('creates a writable vertex buffer of the given size', () => {
            const { device, calls } = createFakeDevice();

            const result = device.createVertexBuffer(64);
            const call = findCall(calls, 'createBuffer');

            assert.equal(result, call.result);
            assert.deepEqual(call.argument, { size: 64, usage: 40 });
        });

        it('adds the given usage flags', () => {
            const { device, calls } = createFakeDevice();

            device.createVertexBuffer(64, 4);

            assert.deepEqual(findCall(calls, 'createBuffer').argument, { size: 64, usage: 44 });
        });
    });

    describe('createIndexBuffer()', () => {
        it('creates a writable index buffer of the given size', () => {
            const { device, calls } = createFakeDevice();

            const result = device.createIndexBuffer(32);
            const call = findCall(calls, 'createBuffer');

            assert.equal(result, call.result);
            assert.deepEqual(call.argument, { size: 32, usage: 24 });
        });

        it('adds the given usage flags', () => {
            const { device, calls } = createFakeDevice();

            device.createIndexBuffer(32, 4);

            assert.deepEqual(findCall(calls, 'createBuffer').argument, { size: 32, usage: 28 });
        });
    });

    describe('createUniformBuffer()', () => {
        it('creates a writable uniform buffer of the given size', () => {
            const { device, calls } = createFakeDevice();

            const result = device.createUniformBuffer(16);
            const call = findCall(calls, 'createBuffer');

            assert.equal(result, call.result);
            assert.deepEqual(call.argument, { size: 16, usage: 72 });
        });

        it('adds the given usage flags', () => {
            const { device, calls } = createFakeDevice();

            device.createUniformBuffer(16, 4);

            assert.deepEqual(findCall(calls, 'createBuffer').argument, { size: 16, usage: 76 });
        });
    });

    describe('createDepthTexture()', () => {
        it('creates a depth32float render attachment of the given size', () => {
            const { device, calls } = createFakeDevice();

            const result = device.createDepthTexture(800, 600);
            const call = findCall(calls, 'createTexture');

            assert.equal(result, call.result);
            assert.deepEqual(call.argument, { size: [800, 600], format: 'depth32float', usage: 16 });
        });

        it('adds the given usage flags', () => {
            const { device, calls } = createFakeDevice();

            device.createDepthTexture(800, 600, 4);

            assert.deepEqual(findCall(calls, 'createTexture').argument, {
                size: [800, 600],
                format: 'depth32float',
                usage: 20,
            });
        });
    });

    describe('createShaderModule()', () => {
        it('creates the module from the given code and returns it at once', () => {
            const { device, calls } = createFakeDevice();

            const result = device.createShaderModule('code');
            const call = findCall(calls, 'createShaderModule');

            assert.equal(result, call.result);
            assert.deepEqual(call.argument, { code: 'code' });
        });

        it('reports a failed compilation', async () => {
            const message = { type: 'error', message: 'unknown type', lineNum: 3, linePos: 7 };
            const { device } = createFakeDevice([message]);
            const details: GPUCompilationInfo[] = [];

            device.addEventListener('compilationerror', (event) => {
                details.push(event.detail);
            });

            device.createShaderModule('code');
            await settle();

            assert.equal(details.length, 1);
            assert.deepEqual(details[0]?.messages, [message]);
        });

        it('does not report a compilation without messages', async () => {
            const { device } = createFakeDevice();
            const details: unknown[] = [];

            device.addEventListener('compilationerror', (event) => {
                details.push(event.detail);
            });

            device.createShaderModule('code');
            await settle();

            assert.equal(details.length, 0);
        });

        it('does not report a compilation with informational messages only', async () => {
            const { device } = createFakeDevice([{ type: 'info', message: 'note' }]);
            const details: unknown[] = [];

            device.addEventListener('compilationerror', (event) => {
                details.push(event.detail);
            });

            device.createShaderModule('code');
            await settle();

            assert.equal(details.length, 0);
        });

        it('does not report a compilation with warnings only', async () => {
            const { device } = createFakeDevice([{ type: 'warning', message: 'unused variable' }]);
            const details: unknown[] = [];

            device.addEventListener('compilationerror', (event) => {
                details.push(event.detail);
            });

            device.createShaderModule('code');
            await settle();

            assert.equal(details.length, 0);
        });

        it('omits warnings and informational messages from a report', async () => {
            const error = { type: 'error', message: 'unknown type' };
            const { device } = createFakeDevice([
                { type: 'info', message: 'note' },
                { type: 'warning', message: 'unused variable' },
                error,
            ]);
            const details: GPUCompilationInfo[] = [];

            device.addEventListener('compilationerror', (event) => {
                details.push(event.detail);
            });

            device.createShaderModule('code');
            await settle();

            assert.deepEqual(details[0]?.messages, [error]);
        });
    });

    describe('createBindGroupLayout()', () => {
        it('forwards the descriptor and returns the result', () => {
            const { device, calls } = createFakeDevice();
            const descriptor = { entries: [] };

            const result = device.createBindGroupLayout(descriptor);
            const call = findCall(calls, 'createBindGroupLayout');

            assert.equal(call.argument, descriptor);
            assert.equal(result, call.result);
        });
    });

    describe('createBindGroup()', () => {
        it('forwards the descriptor and returns the result', () => {
            const { device, calls } = createFakeDevice();
            const descriptor = { entries: [] } as unknown as GPUBindGroupDescriptor;

            const result = device.createBindGroup(descriptor);
            const call = findCall(calls, 'createBindGroup');

            assert.equal(call.argument, descriptor);
            assert.equal(result, call.result);
        });
    });

    describe('createPipelineLayout()', () => {
        it('forwards the descriptor and returns the result', () => {
            const { device, calls } = createFakeDevice();
            const descriptor = { bindGroupLayouts: [] };

            const result = device.createPipelineLayout(descriptor);
            const call = findCall(calls, 'createPipelineLayout');

            assert.equal(call.argument, descriptor);
            assert.equal(result, call.result);
        });
    });

    describe('createRenderPipeline()', () => {
        it('forwards the descriptor and returns the result', () => {
            const { device, calls } = createFakeDevice();
            const descriptor = { layout: 'auto' } as unknown as GPURenderPipelineDescriptor;

            const result = device.createRenderPipeline(descriptor);
            const call = findCall(calls, 'createRenderPipeline');

            assert.equal(call.argument, descriptor);
            assert.equal(result, call.result);
        });
    });

    describe('createCommandEncoder()', () => {
        it('forwards the descriptor and returns the result', () => {
            const { device, calls } = createFakeDevice();
            const descriptor = { label: 'encoder' };

            const result = device.createCommandEncoder(descriptor);
            const call = findCall(calls, 'createCommandEncoder');

            assert.equal(call.argument, descriptor);
            assert.equal(result, call.result);
        });

        it('accepts no descriptor', () => {
            const { device, calls } = createFakeDevice();

            device.createCommandEncoder();

            assert.deepEqual(findCall(calls, 'createCommandEncoder').argument, {});
        });
    });

    describe('submitCommandBuffers()', () => {
        it('submits the command buffers in the given order', () => {
            const { device, calls } = createFakeDevice();
            const bufferA = { label: 'a' } as unknown as GPUCommandBuffer;
            const bufferB = { label: 'b' } as unknown as GPUCommandBuffer;

            device.submitCommandBuffers(bufferA, bufferB);

            assert.deepEqual(findCall(calls, 'submit').argument, [bufferA, bufferB]);
        });
    });

    describe('destroy()', () => {
        it('destroys the WebGPU device', () => {
            const { device, calls } = createFakeDevice();

            device.destroy();

            assert.equal(calls.filter((call) => call.method === 'destroy').length, 1);
        });
    });
});
