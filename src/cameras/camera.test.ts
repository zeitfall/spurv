import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Vector3, Matrix4 } from '../math/index.ts';
import { SceneNode } from '../scene/index.ts';

import { Projection } from './projection.ts';
import { Camera } from './camera.ts';
import { PerspectiveProjection } from './perspective-projection.ts';

import { assertClose, assertArrayClose } from '../testing/index.ts';

class ProjectionA extends Projection {
    computeMatrixInto(target: Matrix4, aspectRatio: number) {
        return target.set(
            aspectRatio, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 3, 0,
            0, 0, 0, 1,
        );
    }
}

function createGeneralMatrix() {
    return new Matrix4().set(
        1, 2, 3, 4,
        5, 6, 7, 8,
        9, 10, 11, 12,
        13, 14, 15, 16,
    );
}

function projectPoint(matrix: Matrix4, x: number, y: number, z: number) {
    const elements = matrix.elements;
    const w = elements[3] * x + elements[7] * y + elements[11] * z + elements[15];

    return [
        (elements[0] * x + elements[4] * y + elements[8] * z + elements[12]) / w,
        (elements[1] * x + elements[5] * y + elements[9] * z + elements[13]) / w,
        (elements[2] * x + elements[6] * y + elements[10] * z + elements[14]) / w,
    ];
}

describe('Camera', () => {
    describe('constructor()', () => {
        it('stores the given projection', () => {
            const projection = new ProjectionA();
            const camera = new Camera(projection);

            assert.equal(camera.projection, projection);
        });
    });

    describe('projection', () => {
        it('throws on assignment', () => {
            const camera = new Camera(new ProjectionA());

            assert.throws(() => Object.assign(camera, { projection: new ProjectionA() }), TypeError);
        });
    });

    describe('setProjection()', () => {
        it('replaces the projection', () => {
            const camera = new Camera(new ProjectionA());
            const projection = new ProjectionA();

            camera.setProjection(projection);

            assert.equal(camera.projection, projection);
        });

        it('returns this camera', () => {
            const camera = new Camera(new ProjectionA());

            assert.equal(camera.setProjection(new ProjectionA()), camera);
        });
    });

    describe('computeViewMatrixInto()', () => {
        it('throws for a camera that is not attached to a node', () => {
            const camera = new Camera(new ProjectionA());

            assert.throws(() => camera.computeViewMatrixInto(new Matrix4()), {
                name: 'Error',
                message: /^Camera\.computeViewMatrixInto: /,
            });
        });

        it('computes the identity matrix for a node without a transform', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            assertArrayClose(target.writeToArray([]), new Matrix4().writeToArray([]));
        });

        it('inverts the translation of the node', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.transform.position.set(1, 2, 3);
            node.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                1, 0, 0, -1,
                0, 1, 0, -2,
                0, 0, 1, -3,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('inverts the rotation of the node', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.transform.rotation.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
            node.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                0, 0, -1, 0,
                0, 1, 0, 0,
                1, 0, 0, 0,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('inverts the scale of the node', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.transform.scale.set(2, 4, 8);
            node.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                0.5, 0, 0, 0,
                0, 0.25, 0, 0,
                0, 0, 0.125, 0,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('inverts the transforms of the ancestors of the node', () => {
            const parent = new SceneNode();
            const child = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            parent.addChild(child);
            child.addComponent(camera);
            parent.transform.position.set(10, 0, 0);
            child.transform.position.set(0, 5, 0);
            child.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                1, 0, 0, -10,
                0, 1, 0, -5,
                0, 0, 1, 0,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('reflects the world matrix of the last update', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.updateWorldMatrix();
            node.transform.position.set(1, 2, 3);
            camera.computeViewMatrixInto(target);

            assertArrayClose(target.writeToArray([]), new Matrix4().writeToArray([]));
        });

        it('follows the camera to another node', () => {
            const nodeA = new SceneNode();
            const nodeB = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            nodeA.addComponent(camera);
            nodeB.transform.position.set(1, 2, 3);
            nodeB.updateWorldMatrix();
            nodeA.removeComponent(camera);
            nodeB.addComponent(camera);
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                1, 0, 0, -1,
                0, 1, 0, -2,
                0, 0, 1, -3,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('yields the world matrix of the node when that matrix is singular', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.transform.position.set(1, 2, 3);
            node.transform.scale.set(0, 1, 1);
            node.updateWorldMatrix();
            camera.computeViewMatrixInto(target);

            const expected = new Matrix4().set(
                0, 0, 0, 1,
                0, 1, 0, 2,
                0, 0, 1, 3,
                0, 0, 0, 1,
            );

            assert.deepEqual(target.writeToArray([]), expected.writeToArray([]));
        });

        it('returns the given matrix', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = new Matrix4();

            node.addComponent(camera);

            assert.equal(camera.computeViewMatrixInto(target), target);
        });
    });

    describe('computeViewProjectionMatrixInto()', () => {
        it('throws for a camera that is not attached to a node', () => {
            const camera = new Camera(new ProjectionA());

            assert.throws(() => camera.computeViewProjectionMatrixInto(new Matrix4(), 1), {
                name: 'Error',
                message: /^Camera\./,
            });
        });

        it('multiplies the projection matrix for the aspect ratio by the view matrix', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.transform.position.set(1, 2, 3);
            node.updateWorldMatrix();
            camera.computeViewProjectionMatrixInto(target, 4);

            const expected = new Matrix4().set(
                4, 0, 0, -4,
                0, 2, 0, -4,
                0, 0, 3, -9,
                0, 0, 0, 1,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('computes the matrix from the current projection', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = createGeneralMatrix();

            node.addComponent(camera);
            node.updateWorldMatrix();
            camera.setProjection(new PerspectiveProjection(Math.PI / 2, 1, 3));
            camera.computeViewProjectionMatrixInto(target, 2);

            const expected = new Matrix4().set(
                0.5, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 0.5, 1.5,
                0, 0, -1, 0,
            );

            assertArrayClose(target.writeToArray([]), expected.writeToArray([]));
        });

        it('maps the clipping planes in front of the node to depths of 1 and 0', () => {
            const node = new SceneNode();
            const camera = new Camera(new PerspectiveProjection(Math.PI / 2, 1, 3));
            const target = new Matrix4();

            node.addComponent(camera);
            node.transform.position.set(0, 0, 5);
            node.updateWorldMatrix();
            camera.computeViewProjectionMatrixInto(target, 1);

            assertArrayClose(projectPoint(target, 0, 0, 4), [0, 0, 1]);
            assertArrayClose(projectPoint(target, 0, 0, 2), [0, 0, 0]);
        });

        it('maps the edges of the field of view to coordinates of 1 and -1', () => {
            const node = new SceneNode();
            const camera = new Camera(new PerspectiveProjection(Math.PI / 2, 1, 3));
            const target = new Matrix4();

            node.addComponent(camera);
            node.transform.position.set(0, 0, 5);
            node.updateWorldMatrix();
            camera.computeViewProjectionMatrixInto(target, 2);

            assertClose(projectPoint(target, 2, 0, 4)[0], 1);
            assertClose(projectPoint(target, -2, 0, 4)[0], -1);
            assertClose(projectPoint(target, 0, 1, 4)[1], 1);
            assertClose(projectPoint(target, 0, -1, 4)[1], -1);
        });

        it('returns the given matrix', () => {
            const node = new SceneNode();
            const camera = new Camera(new ProjectionA());
            const target = new Matrix4();

            node.addComponent(camera);

            assert.equal(camera.computeViewProjectionMatrixInto(target, 1), target);
        });
    });
});
