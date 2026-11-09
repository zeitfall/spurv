import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RenderDeviceTexture } from './render-device-texture.ts';

interface FakeTexture {
    width: number;
    height: number;
    depthOrArrayLayers: number;
    dimension: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: number;
    sampleCount: number;
    mipLevelCount: number;
    views: object[];
    viewDescriptors: unknown[];
    destroyCount: number;
    createView(descriptor?: unknown): object;
    destroy(): void;
}

function createDescriptor(): GPUTextureDescriptor {
    return { size: [800, 600], format: 'depth32float', usage: 16 };
}

function createFakeDevice() {
    const textures: FakeTexture[] = [];

    function createTexture(descriptor: GPUTextureDescriptor) {
        const [width = 0, height = 1, depthOrArrayLayers = 1] = descriptor.size as number[];

        const texture: FakeTexture = {
            width,
            height,
            depthOrArrayLayers,
            dimension: descriptor.dimension ?? '2d',
            format: descriptor.format,
            usage: descriptor.usage,
            sampleCount: descriptor.sampleCount ?? 1,
            mipLevelCount: descriptor.mipLevelCount ?? 1,
            views: [],
            viewDescriptors: [],
            destroyCount: 0,
            createView(viewDescriptor?: unknown) {
                const view = {};

                texture.views.push(view);
                texture.viewDescriptors.push(viewDescriptor);

                return view;
            },
            destroy() {
                texture.destroyCount++;
            },
        };

        textures.push(texture);

        return texture;
    }

    const gpuDevice = { createTexture } as unknown as GPUDevice;

    return { gpuDevice, textures };
}

function createSubject(descriptor = createDescriptor()) {
    const { gpuDevice, textures } = createFakeDevice();

    return {
        textures,
        subject: RenderDeviceTexture.create(gpuDevice, descriptor),
    };
}

function textureAt(textures: FakeTexture[], index: number) {
    const texture = textures[index];

    assert.ok(texture);

    return texture;
}

describe('RenderDeviceTexture', () => {
    describe('create()', () => {
        it('creates a texture from the given descriptor', () => {
            const { textures } = createSubject();

            assert.equal(textures.length, 1);
            assert.equal(textureAt(textures, 0).width, 800);
            assert.equal(textureAt(textures, 0).height, 600);
            assert.equal(textureAt(textures, 0).format, 'depth32float');
            assert.equal(textureAt(textures, 0).usage, 16);
        });
    });

    describe('raw', () => {
        it('returns the wrapped WebGPU texture', () => {
            const { textures, subject } = createSubject();

            assert.equal(subject.raw, textureAt(textures, 0));
        });
    });

    describe('view', () => {
        it('returns the default view of the wrapped WebGPU texture', () => {
            const { textures, subject } = createSubject();

            assert.equal(subject.view, textureAt(textures, 0).views[0]);
            assert.deepEqual(textureAt(textures, 0).viewDescriptors, [undefined]);
        });

        it('returns the same object on every reading', () => {
            const { textures, subject } = createSubject();

            assert.equal(subject.view, subject.view);
            assert.equal(textureAt(textures, 0).views.length, 1);
        });
    });

    describe('version', () => {
        it('starts at zero', () => {
            const { subject } = createSubject();

            assert.equal(subject.version, 0);
        });
    });

    describe('resize()', () => {
        it('replaces the texture with one of the given width and height', () => {
            const { textures, subject } = createSubject();

            subject.resize(1024, 768);

            assert.equal(textureAt(textures, 1).width, 1024);
            assert.equal(textureAt(textures, 1).height, 768);
            assert.equal(subject.raw, textureAt(textures, 1));
        });

        it('replaces the texture when only the width differs', () => {
            const { textures, subject } = createSubject();

            subject.resize(1024, 600);

            assert.equal(textures.length, 2);
            assert.equal(subject.version, 1);
        });

        it('replaces the texture when only the height differs', () => {
            const { textures, subject } = createSubject();

            subject.resize(800, 768);

            assert.equal(textures.length, 2);
            assert.equal(subject.version, 1);
        });

        it('replaces the view with the default view of the replacement', () => {
            const { textures, subject } = createSubject();

            subject.resize(1024, 768);

            assert.equal(subject.view, textureAt(textures, 1).views[0]);
            assert.deepEqual(textureAt(textures, 1).viewDescriptors, [undefined]);
        });

        it('retains the format, the usage, the sample count, and the number of mip levels', () => {
            const { textures, subject } = createSubject({
                size: [256, 256],
                format: 'rgba8unorm',
                usage: 20,
                sampleCount: 4,
                mipLevelCount: 3,
            });

            subject.resize(512, 512);

            assert.equal(textureAt(textures, 1).format, 'rgba8unorm');
            assert.equal(textureAt(textures, 1).usage, 20);
            assert.equal(textureAt(textures, 1).sampleCount, 4);
            assert.equal(textureAt(textures, 1).mipLevelCount, 3);
        });

        it('retains the dimension and the number of layers', () => {
            const { textures, subject } = createSubject({
                size: [64, 64, 8],
                dimension: '3d',
                format: 'rgba8unorm',
                usage: 20,
            });

            subject.resize(128, 128);

            assert.equal(textureAt(textures, 1).dimension, '3d');
            assert.equal(textureAt(textures, 1).depthOrArrayLayers, 8);
        });

        it('destroys only the previous texture', () => {
            const { textures, subject } = createSubject();

            subject.resize(1024, 768);

            assert.equal(textureAt(textures, 0).destroyCount, 1);
            assert.equal(textureAt(textures, 1).destroyCount, 0);
        });

        it('increases the version once per replacement', () => {
            const { subject } = createSubject();

            subject.resize(1024, 768);
            subject.resize(1280, 720);

            assert.equal(subject.version, 2);
        });

        it('leaves the texture, the view, and the version unchanged at the current size', () => {
            const { textures, subject } = createSubject();
            const view = subject.view;

            subject.resize(800, 600);

            assert.equal(textures.length, 1);
            assert.equal(textureAt(textures, 0).destroyCount, 0);
            assert.equal(subject.raw, textureAt(textures, 0));
            assert.equal(subject.view, view);
            assert.equal(subject.version, 0);
        });
    });

    describe('destroy()', () => {
        it('destroys the wrapped WebGPU texture', () => {
            const { textures, subject } = createSubject();

            subject.destroy();

            assert.equal(textureAt(textures, 0).destroyCount, 1);
        });

        it('destroys the replacement after a resize', () => {
            const { textures, subject } = createSubject();

            subject.resize(1024, 768);
            subject.destroy();

            assert.equal(textureAt(textures, 0).destroyCount, 1);
            assert.equal(textureAt(textures, 1).destroyCount, 1);
        });
    });
});
