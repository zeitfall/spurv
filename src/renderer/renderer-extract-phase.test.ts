import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Scene, SceneNode } from '../scene/index.ts';

import { Camera, PerspectiveProjection } from '../cameras/index.ts';

import { Geometry } from '../geometry/index.ts';

import { NormalMaterial, type Material } from '../materials/index.ts';

import { Mesh } from '../meshes/index.ts';

import { RendererExtractPhase } from './renderer-extract-phase.ts';

import { assertArrayClose } from '../testing/index.ts';

const CAMERA_FIELD_OF_VIEW = Math.PI / 2;
const CAMERA_NEAR_DISTANCE = 1;
const CAMERA_FAR_DISTANCE = 3;

const CANVAS_ASPECT_RATIO = 2;

function createCamera() {
    return new Camera(new PerspectiveProjection(
        CAMERA_FIELD_OF_VIEW,
        CAMERA_NEAR_DISTANCE,
        CAMERA_FAR_DISTANCE,
    ));
}

function appendCamera(scene: Scene) {
    const camera = createCamera();
    const cameraNode = new SceneNode();

    cameraNode.addComponent(camera);
    scene.root.addChild(cameraNode);

    return camera;
}

function appendMesh(parent: SceneNode, geometry: Geometry, material: Material) {
    const meshNode = new SceneNode();

    meshNode.addComponent(new Mesh(geometry, material));
    parent.addChild(meshNode);

    return meshNode;
}

describe('RendererExtractPhase', () => {
    describe('execute()', () => {
        it('returns the same frame packet on every call', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const extractPhase = new RendererExtractPhase();

            scene.update();

            const framePacketA = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);
            const framePacketB = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacketA, framePacketB);
        });

        it('writes the view-projection matrix of the camera for the given aspect ratio', () => {
            const scene = new Scene();
            const camera = createCamera();
            const cameraNode = new SceneNode();
            const extractPhase = new RendererExtractPhase();

            cameraNode.transform.position.set(4, 0, 0);
            cameraNode.addComponent(camera);
            scene.root.addChild(cameraNode);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assertArrayClose(framePacket.cameraViewProjectionArray, [
                0.5, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 0.5, -1,
                -2, 0, 1.5, 0,
            ]);
        });

        it('throws an Error for a camera that is not attached to a node', () => {
            const scene = new Scene();
            const camera = createCamera();
            const extractPhase = new RendererExtractPhase();

            scene.update();

            assert.throws(() => extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO), Error);
        });

        it('reports no meshes and no batches for a scene without meshes', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const extractPhase = new RendererExtractPhase();

            scene.root.addChild(new SceneNode());
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshCount, 0);
            assert.equal(framePacket.batches.length, 0);
        });

        it('counts the nodes that hold a mesh at every depth of the scene', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const emptyNode = new SceneNode();
            const extractPhase = new RendererExtractPhase();

            scene.root.addChild(emptyNode);
            appendMesh(scene.root, geometry, material);
            appendMesh(emptyNode, geometry, material);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshCount, 2);
        });

        it('writes the world matrix of a mesh before the world matrices of its descendants', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            const parentNode = appendMesh(scene.root, geometry, material);
            const childNode = appendMesh(parentNode, geometry, material);

            parentNode.transform.position.set(1, 2, 3);
            childNode.transform.position.set(10, 20, 30);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assertArrayClose(framePacket.meshWorldMatrixArray.subarray(0, 32), [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                1, 2, 3, 1,

                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                11, 22, 33, 1,
            ]);
        });

        it('converts the world matrices to 32-bit floats', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const extractPhase = new RendererExtractPhase();

            const meshNode = appendMesh(scene.root, new Geometry(), new NormalMaterial());

            meshNode.transform.position.set(0.1, 0, 0);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshWorldMatrixArray[12], Math.fround(0.1));
        });

        it('keeps the world matrices of the earlier meshes when their array grows', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            const meshCount = 300;

            for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
                const meshNode = appendMesh(scene.root, geometry, material);

                meshNode.transform.position.set(meshIndex + 1, 0, 0);
            }

            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshCount, meshCount);
            assert.equal(framePacket.meshWorldMatrixArray[12], 1);
            assert.equal(framePacket.meshWorldMatrixArray[16 * 299 + 12], 300);
        });

        it('lists one batch for the meshes that share a geometry and a material', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            appendMesh(scene.root, geometry, material);
            appendMesh(scene.root, geometry, material);
            appendMesh(scene.root, geometry, material);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.batches.length, 1);
            assert.equal(framePacket.batches[0].geometry, geometry);
            assert.equal(framePacket.batches[0].material, material);
            assert.deepEqual(framePacket.meshIndexToBatchIndex.slice(0, 3), [0, 0, 0]);
        });

        it('lists separate batches for the meshes that differ in geometry or in material', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometryA = new Geometry();
            const geometryB = new Geometry();
            const materialA = new NormalMaterial();
            const materialB = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            appendMesh(scene.root, geometryA, materialA);
            appendMesh(scene.root, geometryB, materialA);
            appendMesh(scene.root, geometryA, materialB);
            appendMesh(scene.root, geometryB, materialA);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.batches.length, 3);
            assert.equal(framePacket.batches[1].geometry, geometryB);
            assert.equal(framePacket.batches[1].material, materialA);
            assert.equal(framePacket.batches[2].geometry, geometryA);
            assert.equal(framePacket.batches[2].material, materialB);
            assert.deepEqual(framePacket.meshIndexToBatchIndex.slice(0, 4), [0, 1, 2, 1]);
        });

        it('assigns to each batch its position among the batches of the frame', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            appendMesh(scene.root, new Geometry(), material);
            appendMesh(scene.root, new Geometry(), material);
            appendMesh(scene.root, new Geometry(), material);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.deepEqual(framePacket.batches.map((batch) => batch.index), [0, 1, 2]);
        });

        it('lists the batches of an unchanged scene again in the next frame', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            appendMesh(scene.root, geometry, material);
            appendMesh(scene.root, geometry, material);
            scene.update();

            extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshCount, 2);
            assert.equal(framePacket.batches.length, 1);
            assert.equal(framePacket.batches[0].geometry, geometry);
            assert.equal(framePacket.batches[0].index, 0);
            assert.deepEqual(framePacket.meshIndexToBatchIndex.slice(0, 2), [0, 0]);
        });

        it('retains the batch of a geometry and a material between frames', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const extractPhase = new RendererExtractPhase();

            appendMesh(scene.root, new Geometry(), new NormalMaterial());
            scene.update();

            const batchA = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO).batches[0];
            const batchB = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO).batches[0];

            assert.equal(batchA, batchB);
        });

        it('omits the batch of a mesh that left the scene and renumbers the remaining batches', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometryA = new Geometry();
            const geometryB = new Geometry();
            const material = new NormalMaterial();
            const extractPhase = new RendererExtractPhase();

            const meshNodeA = appendMesh(scene.root, geometryA, material);

            appendMesh(scene.root, geometryB, material);
            scene.update();

            extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            scene.root.removeChild(meshNodeA);
            scene.update();

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.meshCount, 1);
            assert.equal(framePacket.batches.length, 1);
            assert.equal(framePacket.batches[0].geometry, geometryB);
            assert.equal(framePacket.batches[0].index, 0);
            assert.equal(framePacket.meshIndexToBatchIndex[0], 0);
        });

        it('lists the batch of the new geometry of a mesh whose geometry changed', () => {
            const scene = new Scene();
            const camera = appendCamera(scene);
            const geometryA = new Geometry();
            const geometryB = new Geometry();
            const material = new NormalMaterial();
            const mesh = new Mesh(geometryA, material);
            const meshNode = new SceneNode();
            const extractPhase = new RendererExtractPhase();

            meshNode.addComponent(mesh);
            scene.root.addChild(meshNode);
            scene.update();

            extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            mesh.setGeometry(geometryB);

            const framePacket = extractPhase.execute(scene, camera, CANVAS_ASPECT_RATIO);

            assert.equal(framePacket.batches.length, 1);
            assert.equal(framePacket.batches[0].geometry, geometryB);
        });
    });
});
