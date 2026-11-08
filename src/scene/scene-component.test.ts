import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SceneComponent } from './scene-component.ts';
import { SceneNode } from './scene-node.ts';

class ComponentA extends SceneComponent {}

describe('SceneComponent', () => {
    describe('node', () => {
        it('is null before the component is attached', () => {
            const component = new ComponentA();

            assert.equal(component.node, null);
        });

        it('is the node that holds the component', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);

            assert.equal(component.node, node);
        });

        it('is null after the component is removed', () => {
            const node = new SceneNode();
            const component = new ComponentA();

            node.addComponent(component);
            node.removeComponent(component);

            assert.equal(component.node, null);
        });

        it('is read-only', () => {
            const component = new ComponentA();

            assert.throws(() => Object.assign(component, { node: new SceneNode() }), TypeError);
        });
    });
});
