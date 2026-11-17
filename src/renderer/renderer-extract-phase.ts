import { Matrix4 } from '../math/index.ts';

import type { Scene, SceneNode } from '../scene/index.ts';

import type { Camera } from '../cameras/index.ts';

import type { Geometry } from '../geometry/index.ts';

import type { Material } from '../materials/index.ts';

import { Mesh } from '../meshes/index.ts';

import type { RenderBatch, RenderFramePacket } from './types.ts';

const DEFAULT_MESH_COUNT = 64;

/**
 * A phase of a frame that collects the data of the frame from a scene and a camera.
 */
class RendererExtractPhase {
    #uniqueBatches: WeakMap<Geometry, WeakMap<Material, RenderBatch>>;

    #frameIndex: number;
    #framePacket: RenderFramePacket;

    /**
     * Creates an extract phase.
     */
    constructor() {
        this.#uniqueBatches = new WeakMap();

        this.#frameIndex = 0;
        this.#framePacket = {
            cameraViewProjectionArray: new Float32Array(16),
            meshCount: 0,
            meshWorldMatrixArray: new Float32Array(16 * DEFAULT_MESH_COUNT),
            meshIndexToBatchIndex: [],
            batches: [],
        };
    }

    /**
     * Updates the frame packet for the current frame from the given scene and camera.
     *
     * @param scene - The scene to draw.
     * @param camera - The camera through which the scene is viewed.
     * @param canvasAspectRatio - The ratio of the width of the canvas to its height.
     *
     * @returns The frame packet of this extract phase.
     *
     * @throws Error if the given camera is not attached to a node.
     *
     * @remarks The frame packet is valid until the next call.
     */
    execute(scene: Scene, camera: Camera, canvasAspectRatio: number) {
        this.#updateCameraPart(camera, canvasAspectRatio);
        this.#updateScenePart(scene);

        return this.#framePacket;
    }

    #updateCameraPart(camera: Camera, canvasAspectRatio: number) {
        camera.computeViewProjectionMatrixInto(_matrix4A, canvasAspectRatio);
        _matrix4A.writeToArray(this.#framePacket.cameraViewProjectionArray);
    }

    #updateScenePart(scene: Scene) {
        this.#frameIndex++;
        this.#framePacket.batches.length = 0;
        this.#framePacket.meshCount = 0;

        this.#traverseSceneSubtree(scene.root);
    }

    #traverseSceneSubtree(node: SceneNode) {
        const mesh = node.getComponent(Mesh);

        if (mesh !== null) {
            const batch = this.#updateOrCreateBatch(mesh.geometry, mesh.material);

            const meshIndex = this.#framePacket.meshCount;
            const meshWorldMatrixOffset = 16 * meshIndex;
            const meshWorldMatrixArrayLength = this.#framePacket.meshWorldMatrixArray.length;

            if (meshWorldMatrixOffset >= meshWorldMatrixArrayLength) {
                const extendedMeshWorldMatrixArray = new Float32Array(2 * meshWorldMatrixArrayLength);

                extendedMeshWorldMatrixArray.set(this.#framePacket.meshWorldMatrixArray);

                this.#framePacket.meshWorldMatrixArray = extendedMeshWorldMatrixArray;
            }

            this.#framePacket.meshCount++;
            this.#framePacket.meshIndexToBatchIndex[meshIndex] = batch.index;

            node.writeWorldMatrixToArray(this.#framePacket.meshWorldMatrixArray, meshWorldMatrixOffset);
        }

        for (const child of node.children()) {
            this.#traverseSceneSubtree(child);
        }
    }

    #updateOrCreateBatch(geometry: Geometry, material: Material) {
        let batchByMaterial = this.#uniqueBatches.get(geometry) ?? null;

        if (batchByMaterial === null) {
            batchByMaterial = new WeakMap();

            this.#uniqueBatches.set(geometry, batchByMaterial);
        }

        let batch = batchByMaterial.get(material) ?? null;

        if (batch === null) {
            batch = {
                index: -1,
                geometry,
                material,
                updatedAtFrame: -1,
            };

            batchByMaterial.set(material, batch);
        }

        if (batch.updatedAtFrame !== this.#frameIndex) {
            batch.index = this.#framePacket.batches.length;
            batch.updatedAtFrame = this.#frameIndex;

            this.#framePacket.batches.push(batch);
        }

        return batch;
    }
}

const _matrix4A = new Matrix4();

export { RendererExtractPhase };
