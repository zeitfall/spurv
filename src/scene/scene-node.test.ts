import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Matrix4 } from '../math/index.ts';

import { SceneComponent } from './scene-component.ts';
import { SceneNode } from './scene-node.ts';

import { assertArrayClose } from '../testing/index.ts';

class ComponentA extends SceneComponent {}

class ComponentB extends SceneComponent {}

class ComponentC extends ComponentA {}

function readChildren(node: SceneNode) {
    return [...node.children()];
}

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

describe('SceneNode', () => {
    describe('constructor()', () => {
        it('creates a node without a parent and without children', () => {
            const node = new SceneNode();

            assert.equal(node.parent, null);
            assert.deepEqual(readChildren(node), []);
        });

        it('creates the identity world matrix', () => {
            const node = new SceneNode();

            assert.deepEqual(readWorldMatrix(node), new Matrix4().writeToArray([]));
        });
    });

    describe('parent', () => {
        it('throws on assignment', () => {
            const node = new SceneNode();

            assert.throws(() => Object.assign(node, { parent: new SceneNode() }), TypeError);
        });
    });

    describe('transform', () => {
        it('returns the same instance on every read', () => {
            const node = new SceneNode();

            assert.equal(node.transform, node.transform);
        });

        it('throws on assignment', () => {
            const node = new SceneNode();

            assert.throws(() => Object.assign(node, { transform: node.transform }), TypeError);
        });
    });

    describe('addChild()', () => {
        it('sets the parent of the child', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);

            assert.equal(child.parent, parent);
            assert.deepEqual(readChildren(parent), [child]);
        });

        it('appends the child after the existing children', () => {
            const parent = new SceneNode();
            const childA = new SceneNode();
            const childB = new SceneNode();

            parent.addChild(childA);
            parent.addChild(childB);

            assert.deepEqual(readChildren(parent), [childA, childB]);
        });

        it('detaches the child from its previous parent', () => {
            const previousParent = new SceneNode();
            const nextParent = new SceneNode();
            const child = new SceneNode();

            previousParent.addChild(child);
            nextParent.addChild(child);

            assert.equal(child.parent, nextParent);
            assert.deepEqual(readChildren(previousParent), []);
            assert.deepEqual(readChildren(nextParent), [child]);
        });

        it('moves a child that is added again to the end without duplicating it', () => {
            const parent = new SceneNode();
            const childA = new SceneNode();
            const childB = new SceneNode();

            parent.addChild(childA);
            parent.addChild(childB);
            parent.addChild(childA);

            assert.equal(childA.parent, parent);
            assert.deepEqual(readChildren(parent), [childB, childA]);
        });

        it('returns the node', () => {
            const parent = new SceneNode();

            assert.equal(parent.addChild(new SceneNode()), parent);
        });

        it('accepts a descendant and moves it under the node', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);
            grandparent.addChild(child);

            assert.equal(child.parent, grandparent);
            assert.deepEqual(readChildren(grandparent), [parent, child]);
            assert.deepEqual(readChildren(parent), []);
        });

        it('throws a RangeError for the node itself', () => {
            const node = new SceneNode();

            assert.throws(() => node.addChild(node), { name: 'RangeError', message: /^SceneNode\.addChild: / });
        });

        it('throws a RangeError for an ancestor of the node', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);

            assert.throws(() => child.addChild(grandparent), { name: 'RangeError', message: /^SceneNode\.addChild: / });
        });

        it('leaves the tree unchanged when it throws', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);

            assert.throws(() => child.addChild(grandparent), RangeError);

            assert.equal(grandparent.parent, null);
            assert.equal(parent.parent, grandparent);
            assert.equal(child.parent, parent);
            assert.deepEqual(readChildren(child), []);
        });
    });

    describe('removeChild()', () => {
        it('removes the child and clears its parent', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            parent.removeChild(child);

            assert.equal(child.parent, null);
            assert.deepEqual(readChildren(parent), []);
        });

        it('keeps the order of the remaining children', () => {
            const parent = new SceneNode();
            const childA = new SceneNode();
            const childB = new SceneNode();
            const childC = new SceneNode();

            parent.addChild(childA);
            parent.addChild(childB);
            parent.addChild(childC);
            parent.removeChild(childB);

            assert.deepEqual(readChildren(parent), [childA, childC]);
        });

        it('returns the node', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);

            assert.equal(parent.removeChild(child), parent);
        });

        it('throws a RangeError for a node without a parent', () => {
            const parent = new SceneNode();

            assert.throws(() => parent.removeChild(new SceneNode()), {
                name: 'RangeError',
                message: /^SceneNode\.removeChild: /,
            });
        });

        it('throws a RangeError for a child of another node', () => {
            const parent = new SceneNode();
            const otherParent = new SceneNode();
            const child = new SceneNode();

            otherParent.addChild(child);

            assert.throws(() => parent.removeChild(child), {
                name: 'RangeError',
                message: /^SceneNode\.removeChild: /,
            });
            assert.equal(child.parent, otherParent);
        });

        it('throws a RangeError for a grandchild', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);

            assert.throws(() => grandparent.removeChild(child), {
                name: 'RangeError',
                message: /^SceneNode\.removeChild: /,
            });
        });
    });

    describe('updateWorldMatrix()', () => {
        it('sets the world matrix to the local matrix for a node without a parent', () => {
            const node = new SceneNode();

            node.transform.position.set(1, 2, 3);
            node.updateWorldMatrix();

            assertArrayClose(readWorldMatrix(node), createTranslation(1, 2, 3).writeToArray([]));
        });

        it('applies the local matrix first and the world matrix of the parent second', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            parent.transform.position.set(10, 0, 0);
            parent.transform.rotation.set(0, 0, Math.SQRT1_2, Math.SQRT1_2);
            child.transform.position.set(1, 0, 0);
            child.updateWorldMatrix();

            const expectedMatrix = new Matrix4().set(
                0, -1, 0, 10,
                1, 0, 0, 1,
                0, 0, 1, 0,
                0, 0, 0, 1,
            );

            assertArrayClose(readWorldMatrix(child), expectedMatrix.writeToArray([]));
        });

        it('updates the ancestors before the node', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);
            grandparent.transform.position.set(0, 5, 0);
            parent.transform.position.set(1, 0, 0);
            child.transform.position.set(0, 0, 2);
            child.updateWorldMatrix();

            assertArrayClose(readWorldMatrix(parent), createTranslation(1, 5, 0).writeToArray([]));
            assertArrayClose(readWorldMatrix(child), createTranslation(1, 5, 2).writeToArray([]));
        });

        it('leaves the descendants unchanged', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            parent.transform.position.set(1, 0, 0);
            parent.updateWorldMatrix();

            assert.deepEqual(readWorldMatrix(child), new Matrix4().writeToArray([]));
        });

        it('reflects changes made after the previous update', () => {
            const node = new SceneNode();

            node.transform.position.set(1, 0, 0);
            node.updateWorldMatrix();
            node.transform.position.set(2, 0, 0);
            node.updateWorldMatrix();

            assertArrayClose(readWorldMatrix(node), createTranslation(2, 0, 0).writeToArray([]));
        });

        it('keeps the world matrix version when nothing changed', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            child.updateWorldMatrix();
            child.updateWorldMatrix();

            assert.equal(parent.worldMatrixVersion, 1);
            assert.equal(child.worldMatrixVersion, 1);
        });

        it('increments the world matrix version of the node and its descendant when the node changed', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            child.updateWorldMatrix();
            parent.transform.position.x = 1;
            child.updateWorldMatrix();

            assert.equal(parent.worldMatrixVersion, 2);
            assert.equal(child.worldMatrixVersion, 2);
        });

        it('reflects a change of the parent made after the previous update', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            child.updateWorldMatrix();
            parent.transform.position.set(3, 0, 0);
            child.updateWorldMatrix();

            assertArrayClose(readWorldMatrix(child), createTranslation(3, 0, 0).writeToArray([]));
        });

        it('reflects a new parent after the node is moved', () => {
            const previousParent = new SceneNode();
            const nextParent = new SceneNode();
            const child = new SceneNode();

            previousParent.transform.position.set(1, 0, 0);
            nextParent.transform.position.set(0, 1, 0);
            previousParent.addChild(child);
            child.updateWorldMatrix();
            nextParent.addChild(child);
            child.updateWorldMatrix();

            assertArrayClose(readWorldMatrix(child), createTranslation(0, 1, 0).writeToArray([]));
        });

        it('treats a removed node as a node without a parent', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.transform.position.set(1, 0, 0);
            parent.addChild(child);
            child.updateWorldMatrix();
            parent.removeChild(child);
            child.updateWorldMatrix();

            assert.deepEqual(readWorldMatrix(child), new Matrix4().writeToArray([]));
        });
    });

    describe('writeWorldMatrixToArray()', () => {
        it('writes the world matrix at the given offset', () => {
            const node = new SceneNode();
            const target = new Float32Array(18);

            node.transform.position.set(1, 2, 3);
            node.updateWorldMatrix();
            node.writeWorldMatrixToArray(target, 2);

            const expectedArray = createTranslation(1, 2, 3).writeToArray([0, 0], 2);

            assert.deepEqual(Array.from(target), expectedArray);
        });

        it('writes the world matrix at index 0 when the offset is omitted', () => {
            const node = new SceneNode();
            const target = new Float32Array(16);

            node.transform.position.set(1, 2, 3);
            node.updateWorldMatrix();
            node.writeWorldMatrixToArray(target);

            const expectedArray = createTranslation(1, 2, 3).writeToArray([]);

            assert.deepEqual(Array.from(target), expectedArray);
        });

        it('returns the given array', () => {
            const node = new SceneNode();
            const target = new Float32Array(16);

            assert.equal(node.writeWorldMatrixToArray(target, 0), target);
        });

        it('reflects the last update, not later changes', () => {
            const node = new SceneNode();

            node.transform.position.set(1, 0, 0);

            assert.deepEqual(node.writeWorldMatrixToArray([], 0), new Matrix4().writeToArray([]));
        });
    });

    describe('updateSubtree()', () => {
        it('updates all descendants of the node', () => {
            const parent = new SceneNode();
            const child = new SceneNode();
            const grandchild = new SceneNode();

            parent.addChild(child);
            child.addChild(grandchild);
            parent.transform.position.set(1, 0, 0);
            child.transform.position.set(0, 2, 0);
            grandchild.transform.position.set(0, 0, 3);
            parent.updateSubtree();

            assertArrayClose(readWorldMatrix(child), createTranslation(1, 2, 0).writeToArray([]));
            assertArrayClose(readWorldMatrix(grandchild), createTranslation(1, 2, 3).writeToArray([]));
        });

        it('updates the ancestors before the node', () => {
            const grandparent = new SceneNode();
            const parent = new SceneNode();
            const child = new SceneNode();

            grandparent.addChild(parent);
            parent.addChild(child);
            grandparent.transform.position.set(0, 5, 0);
            parent.updateSubtree();

            assertArrayClose(readWorldMatrix(parent), createTranslation(0, 5, 0).writeToArray([]));
            assertArrayClose(readWorldMatrix(child), createTranslation(0, 5, 0).writeToArray([]));
        });

        it('leaves the siblings of the node unchanged', () => {
            const parent = new SceneNode();
            const child = new SceneNode();
            const sibling = new SceneNode();

            parent.addChild(child);
            parent.addChild(sibling);
            parent.transform.position.set(1, 0, 0);
            child.updateSubtree();

            assert.deepEqual(readWorldMatrix(sibling), new Matrix4().writeToArray([]));
        });

        it('updates a descendant whose parent was updated earlier by updateWorldMatrix()', () => {
            const parent = new SceneNode();
            const childA = new SceneNode();
            const childB = new SceneNode();

            parent.addChild(childA);
            parent.addChild(childB);
            parent.updateSubtree();
            parent.transform.position.set(4, 0, 0);
            childA.updateWorldMatrix();
            parent.updateSubtree();

            assertArrayClose(readWorldMatrix(childB), createTranslation(4, 0, 0).writeToArray([]));
        });

        it('keeps the world matrix versions when nothing changed', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);
            parent.updateSubtree();
            parent.updateSubtree();

            assert.equal(parent.worldMatrixVersion, 1);
            assert.equal(child.worldMatrixVersion, 1);
        });
    });

    describe('copyWorldMatrixTo()', () => {
        it('returns the given matrix', () => {
            const node = new SceneNode();
            const target = new Matrix4();

            assert.equal(node.copyWorldMatrixTo(target), target);
        });

        it('reflects the last update, not later changes', () => {
            const node = new SceneNode();

            node.transform.position.set(1, 0, 0);

            assert.deepEqual(readWorldMatrix(node), new Matrix4().writeToArray([]));
        });

        it('returns a copy that is independent of the node', () => {
            const node = new SceneNode();
            const target = node.copyWorldMatrixTo(new Matrix4());

            target.copy(createGeneralMatrix());

            assert.deepEqual(readWorldMatrix(node), new Matrix4().writeToArray([]));
        });
    });

    describe('children()', () => {
        it('returns a new iterator on every call', () => {
            const parent = new SceneNode();
            const child = new SceneNode();

            parent.addChild(child);

            assert.deepEqual(readChildren(parent), [child]);
            assert.deepEqual(readChildren(parent), [child]);
        });

        it('does not expose the internal array', () => {
            const parent = new SceneNode();

            parent.addChild(new SceneNode());

            assert.equal(Array.isArray(parent.children()), false);
        });
    });

    describe('addComponent()', () => {
        it('attaches the component to the node', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);

            assert.equal(component.node, node);
            assert.equal(node.getComponent(ComponentA), component);
        });

        it('returns the node', () => {
            const node = new SceneNode();

            assert.equal(node.addComponent(new ComponentA()), node);
        });

        it('accepts components of different classes', () => {
            const node = new SceneNode();
            const componentA = new ComponentA();
            const componentB = new ComponentB();

            node.addComponent(componentA).addComponent(componentB);

            assert.equal(node.getComponent(ComponentA), componentA);
            assert.equal(node.getComponent(ComponentB), componentB);
        });

        it('treats a subclass as a different class', () => {
            const node = new SceneNode();
            const componentA = new ComponentA();
            const componentC = new ComponentC();

            node.addComponent(componentA).addComponent(componentC);

            assert.equal(node.getComponent(ComponentA), componentA);
            assert.equal(node.getComponent(ComponentC), componentC);
        });

        it('rejects a second component of the same class and keeps the first', () => {
            const node = new SceneNode();
            const componentFirst = new ComponentA();
            const componentSecond = new ComponentA();

            node.addComponent(componentFirst);

            assert.throws(() => node.addComponent(componentSecond), {
                name: 'RangeError',
                message: /^SceneNode\.addComponent: /,
            });
            assert.equal(node.getComponent(ComponentA), componentFirst);
            assert.equal(componentSecond.node, null);
        });

        it('rejects a component that this node already holds', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);

            assert.throws(() => node.addComponent(component), {
                name: 'RangeError',
                message: /^SceneNode\.addComponent: /,
            });
            assert.equal(component.node, node);
        });

        it('rejects a component attached to another node and leaves it there', () => {
            const nodeA = new SceneNode();
            const nodeB = new SceneNode();
            const component = new ComponentA();

            nodeA.addComponent(component);

            assert.throws(() => nodeB.addComponent(component), {
                name: 'RangeError',
                message: /^SceneNode\.addComponent: /,
            });
            assert.equal(component.node, nodeA);
            assert.equal(nodeA.getComponent(ComponentA), component);
            assert.equal(nodeB.getComponent(ComponentA), null);
        });

        it('accepts a removed component on another node', () => {
            const nodeA = new SceneNode();
            const nodeB = new SceneNode();
            const component = new ComponentA();

            nodeA.addComponent(component);
            nodeA.removeComponent(component);
            nodeB.addComponent(component);

            assert.equal(component.node, nodeB);
            assert.equal(nodeB.getComponent(ComponentA), component);
        });
    });

    describe('removeComponent()', () => {
        it('detaches the component from the node', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);
            node.removeComponent(component);

            assert.equal(component.node, null);
            assert.equal(node.getComponent(ComponentA), null);
        });

        it('returns the node', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);

            assert.equal(node.removeComponent(component), node);
        });

        it('allows another component of the same class afterwards', () => {
            const node = new SceneNode();
            const componentFirst = new ComponentA();
            const componentSecond = new ComponentA();

            node.addComponent(componentFirst);
            node.removeComponent(componentFirst);
            node.addComponent(componentSecond);

            assert.equal(node.getComponent(ComponentA), componentSecond);
        });

        it('rejects a component that is not attached and keeps the component of its class', () => {
            const node = new SceneNode();
            const componentHeld = new ComponentA();
            const componentDetached = new ComponentA();

            node.addComponent(componentHeld);

            assert.throws(() => node.removeComponent(componentDetached), {
                name: 'RangeError',
                message: /^SceneNode\.removeComponent: /,
            });
            assert.equal(node.getComponent(ComponentA), componentHeld);
        });

        it('rejects a component attached to another node and changes neither node', () => {
            const nodeA = new SceneNode();
            const nodeB = new SceneNode();
            const componentA = new ComponentA();
            const componentB = new ComponentA();

            nodeA.addComponent(componentA);
            nodeB.addComponent(componentB);

            assert.throws(() => nodeB.removeComponent(componentA), {
                name: 'RangeError',
                message: /^SceneNode\.removeComponent: /,
            });
            assert.equal(componentA.node, nodeA);
            assert.equal(nodeA.getComponent(ComponentA), componentA);
            assert.equal(nodeB.getComponent(ComponentA), componentB);
        });
    });

    describe('getComponent()', () => {
        it('returns null when the node holds no component of the class', () => {
            const node = new SceneNode();

            node.addComponent(new ComponentB());

            assert.equal(node.getComponent(ComponentA), null);
        });

        it('does not find a subclass by its parent class', () => {
            const node = new SceneNode();

            node.addComponent(new ComponentC());

            assert.equal(node.getComponent(ComponentA), null);
        });
    });

    describe('components()', () => {
        it('iterates over no components for a new node', () => {
            const node = new SceneNode();

            assert.equal([...node.components()].length, 0);
        });

        it('iterates over the components in the order of their appending', () => {
            const node = new SceneNode();
            const componentA = new ComponentA();
            const componentB = new ComponentB();

            node.addComponent(componentB).addComponent(componentA);

            const [componentFirst, componentSecond] = node.components();

            assert.equal(componentFirst, componentB);
            assert.equal(componentSecond, componentA);
        });

        it('does not expose the internal map', () => {
            const node = new SceneNode();

            assert.equal(node.components() instanceof Map, false);
        });
    });
});
