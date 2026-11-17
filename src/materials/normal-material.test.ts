import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VertexAttributeName } from '../geometry/index.ts';

import { CAMERA_SHADER_CODE, MESHES_SHADER_CODE } from '../shaders/index.ts';

import { Material } from './material.ts';
import { NormalMaterial } from './normal-material.ts';

describe('NormalMaterial', () => {
    describe('constructor()', () => {
        it('creates an instance of Material', () => {
            const material = new NormalMaterial();

            assert.ok(material instanceof Material);
        });
    });

    describe('shader', () => {
        it('is the same object for every instance', () => {
            const materialA = new NormalMaterial();
            const materialB = new NormalMaterial();

            assert.equal(materialA.shader, materialB.shader);
        });

        it('is frozen together with the names of its required attributes', () => {
            const material = new NormalMaterial();

            assert.ok(Object.isFrozen(material.shader));
            assert.ok(Object.isFrozen(material.shader.requiredAttributeNames));
        });

        it('requires the position and the normal, in this order', () => {
            const material = new NormalMaterial();

            assert.deepEqual(material.shader.requiredAttributeNames, [
                VertexAttributeName.POSITION,
                VertexAttributeName.NORMAL,
            ]);
        });

        it('reads the position at the location 0 and the normal at the location 1', () => {
            const material = new NormalMaterial();

            assert.match(material.shader.code, /@location\(0\)\s+position\s+: vec3f/);
            assert.match(material.shader.code, /@location\(1\)\s+normal\s+: vec3f/);
        });

        it('includes the shared code of the camera and of the meshes', () => {
            const material = new NormalMaterial();

            assert.ok(material.shader.code.includes(CAMERA_SHADER_CODE));
            assert.ok(material.shader.code.includes(MESHES_SHADER_CODE));
        });

        it('defines the entry points of the vertex stage and of the fragment stage', () => {
            const material = new NormalMaterial();

            assert.match(material.shader.code, /@vertex\s+fn vertexStage\(/);
            assert.match(material.shader.code, /@fragment\s+fn fragmentStage\(/);
        });
    });
});
