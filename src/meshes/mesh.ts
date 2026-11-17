import { SceneComponent } from '../scene/index.ts';

import type { Geometry } from '../geometry/index.ts';

import type { Material } from '../materials/index.ts';

/**
 * A component that displays a geometry with a material at its node.
 */
class Mesh extends SceneComponent {
    #geometry: Geometry;
    #material: Material;

    /**
     * Creates a mesh with the given geometry and material.
     *
     * @param geometry - The geometry of the mesh.
     * @param material - The material of the mesh.
     */
    constructor(geometry: Geometry, material: Material) {
        super();

        this.#geometry = geometry;
        this.#material = material;
    }

    /**
     * The geometry that this mesh displays.
     */
    get geometry() {
        return this.#geometry;
    }

    /**
     * The material with which this mesh displays its geometry.
     */
    get material() {
        return this.#material;
    }

    /**
     * Sets this mesh to the given geometry.
     *
     * @param geometry - The geometry to display.
     */
    setGeometry(geometry: Geometry) {
        this.#geometry = geometry;

        return this;
    }

    /**
     * Sets this mesh to the given material.
     *
     * @param material - The material to use.
     */
    setMaterial(material: Material) {
        this.#material = material;

        return this;
    }
}

export { Mesh };
