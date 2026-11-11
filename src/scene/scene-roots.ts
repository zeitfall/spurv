import type { SceneNode } from './scene-node.ts';

const sceneRoots = new WeakSet<SceneNode>();

function hasSceneRoot(node: SceneNode) {
    return sceneRoots.has(node);
}

function addSceneRoot(node: SceneNode) {
    sceneRoots.add(node);
}

export { hasSceneRoot, addSceneRoot };
