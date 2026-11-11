import type { SceneComponent } from './scene-component.ts';
import type { SceneNode } from './scene-node.ts';

const sceneComponentNodes = new WeakMap<SceneComponent, SceneNode>();

function getSceneComponentNode(component: SceneComponent) {
    return sceneComponentNodes.get(component) ?? null;
}

function setSceneComponentNode(component: SceneComponent, node: SceneNode) {
    sceneComponentNodes.set(component, node);
}

function deleteSceneComponentNode(component: SceneComponent) {
    sceneComponentNodes.delete(component);
}

export { getSceneComponentNode, setSceneComponentNode, deleteSceneComponentNode };
