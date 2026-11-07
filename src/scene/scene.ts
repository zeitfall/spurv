import { SceneNode } from './scene-node.ts';
import { sceneRoots } from './scene-roots.ts';

/**
 * A set of nodes organized under a single root node.
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
     * The node that holds all other nodes of this scene.
     */
    get root() {
        return this.#root;
    }

    /**
     * Applies the changes made to the nodes of this scene.
     */
    update() {
        this.#root.updateSubtree();
    }
}

export { Scene };
