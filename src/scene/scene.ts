import { SceneNode } from './scene-node.ts';
import { sceneRoots } from './scene-roots.ts';

/**
 * A hierarchy of nodes that descend from a single root node.
 */
class Scene {
    #root: SceneNode;

    /**
     * Creates an empty scene.
     */
    constructor() {
        this.#root = new SceneNode();

        sceneRoots.add(this.#root);
    }

    /**
     * The node of which every other node in this scene is a descendant.
     */
    get root() {
        return this.#root;
    }

    /**
     * Updates the world matrices of all nodes in this scene.
     */
    update() {
        this.#root.updateSubtree();
    }
}

export { Scene };
