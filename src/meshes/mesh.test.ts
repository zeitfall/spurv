import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SceneNode } from '../scene/index.ts';

import { Geometry } from '../geometry/index.ts';

import { NormalMaterial } from '../materials/index.ts';

import { Mesh } from './mesh.ts';

describe('Mesh', () => {
    describe('constructor()', () => {
        it('stores the given geometry and material', () => {
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const mesh = new Mesh(geometry, material);

            assert.equal(mesh.geometry, geometry);
            assert.equal(mesh.material, material);
        });

        it('accepts a geometry and a material that another mesh holds', () => {
            const geometry = new Geometry();
            const material = new NormalMaterial();
            const meshA = new Mesh(geometry, material);
            const meshB = new Mesh(geometry, material);

            assert.equal(meshB.geometry, meshA.geometry);
            assert.equal(meshB.material, meshA.material);
        });

        it('creates a component that a node finds by the class Mesh', () => {
            const node = new SceneNode();
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            node.addComponent(mesh);

            assert.equal(node.getComponent(Mesh), mesh);
            assert.equal(mesh.node, node);
        });
    });

    describe('geometry', () => {
        it('throws on assignment', () => {
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            assert.throws(() => Object.assign(mesh, { geometry: new Geometry() }), TypeError);
        });
    });

    describe('material', () => {
        it('throws on assignment', () => {
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            assert.throws(() => Object.assign(mesh, { material: new NormalMaterial() }), TypeError);
        });
    });

    describe('setGeometry()', () => {
        it('replaces the geometry and keeps the material', () => {
            const material = new NormalMaterial();
            const mesh = new Mesh(new Geometry(), material);
            const geometry = new Geometry();

            mesh.setGeometry(geometry);

            assert.equal(mesh.geometry, geometry);
            assert.equal(mesh.material, material);
        });

        it('keeps the mesh on its node', () => {
            const node = new SceneNode();
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            node.addComponent(mesh);
            mesh.setGeometry(new Geometry());

            assert.equal(node.getComponent(Mesh), mesh);
            assert.equal(mesh.node, node);
        });

        it('returns this mesh', () => {
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            assert.equal(mesh.setGeometry(new Geometry()), mesh);
        });
    });

    describe('setMaterial()', () => {
        it('replaces the material and keeps the geometry', () => {
            const geometry = new Geometry();
            const mesh = new Mesh(geometry, new NormalMaterial());
            const material = new NormalMaterial();

            mesh.setMaterial(material);

            assert.equal(mesh.material, material);
            assert.equal(mesh.geometry, geometry);
        });

        it('keeps the mesh on its node', () => {
            const node = new SceneNode();
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            node.addComponent(mesh);
            mesh.setMaterial(new NormalMaterial());

            assert.equal(node.getComponent(Mesh), mesh);
            assert.equal(mesh.node, node);
        });

        it('returns this mesh', () => {
            const mesh = new Mesh(new Geometry(), new NormalMaterial());

            assert.equal(mesh.setMaterial(new NormalMaterial()), mesh);
        });
    });
});
