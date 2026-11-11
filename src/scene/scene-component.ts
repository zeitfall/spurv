import { getSceneComponentNode } from './scene-component-nodes.ts';

/**
 * A part of the behavior or the data of a scene node, attached to at most one node at a time.
 */
abstract class SceneComponent {
    /**
     * The node that holds this component, or null if this component is not attached.
     */
    get node() {
        return getSceneComponentNode(this);
    }
}

export { SceneComponent };
