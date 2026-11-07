import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Matrix4 } from '../math/index.ts';

import { SceneNode } from './scene-node.ts';
import { Scene } from './scene.ts';

import { assertArrayClose } from '../testing/index.ts';

function createGeneralMatrix() {
    return new Matrix4().set(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
    );
}

function createTranslation(x: number, y: number, z: number) {
    return new Matrix4().set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1,
    );
}

function readWorldMatrix(node: SceneNode) {
    return node.copyWorldMatrixTo(createGeneralMatrix()).writeToArray([]);
}

describe('Scene', () => {
    describe('constructor()', () => {
        it('creates a root without a parent and without children', () => {
            const scene = new Scene();

            assert.equal(scene.root.parent, null);
            assert.deepEqual([...scene.root.children()], []);
        });

        it('creates a separate root for each scene', () => {
            const sceneA = new Scene();
            const sceneB = new Scene();

            assert.notEqual(sceneA.root, sceneB.root);
        });
    });

    describe('root', () => {
        it('returns the same instance on every read', () => {
            const scene = new Scene();

            assert.equal(scene.root, scene.root);
        });

        it('throws on assignment', () => {
            const scene = new Scene();

            assert.throws(() => Object.assign(scene, { root: new SceneNode() }), TypeError);
        });

        it('cannot become a child of another node', () => {
            const scene = new Scene();
            const node = new SceneNode();

            assert.throws(() => node.addChild(scene.root), {
                name: 'RangeError',
                message: /^SceneNode\.addChild: expected a node that is not a scene root/,
            });
            assert.equal(scene.root.parent, null);
        });

        it('cannot become a child of a node of another scene', () => {
            const sceneA = new Scene();
            const sceneB = new Scene();

            assert.throws(() => sceneA.root.addChild(sceneB.root), RangeError);
        });
    });

    describe('update()', () => {
        it('updates the world matrix of the root', () => {
            const scene = new Scene();

            scene.root.transform.position.set(1, 2, 3);
            scene.update();

            assertArrayClose(readWorldMatrix(scene.root), createTranslation(1, 2, 3).writeToArray([]));
        });

        it('updates the world matrices of all nodes', () => {
            const scene = new Scene();
            const child = new SceneNode();
            const grandchild = new SceneNode();
            const sibling = new SceneNode();

            scene.root.addChild(child);
            scene.root.addChild(sibling);
            child.addChild(grandchild);
            scene.root.transform.position.set(1, 0, 0);
            child.transform.position.set(0, 2, 0);
            grandchild.transform.position.set(0, 0, 3);
            sibling.transform.position.set(0, 0, -1);
            scene.update();

            assertArrayClose(readWorldMatrix(child), createTranslation(1, 2, 0).writeToArray([]));
            assertArrayClose(readWorldMatrix(grandchild), createTranslation(1, 2, 3).writeToArray([]));
            assertArrayClose(readWorldMatrix(sibling), createTranslation(1, 0, -1).writeToArray([]));
        });

        it('keeps the world matrix versions when nothing changed', () => {
            const scene = new Scene();
            const child = new SceneNode();

            scene.root.addChild(child);
            scene.update();
            scene.update();

            assert.equal(scene.root.worldMatrixVersion, 1);
            assert.equal(child.worldMatrixVersion, 1);
        });
    });
});
