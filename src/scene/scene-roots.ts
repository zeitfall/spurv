import type { SceneNode } from './scene-node.ts';

const sceneRoots = new WeakSet<SceneNode>();

export { sceneRoots };
