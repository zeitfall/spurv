import type { SceneComponent } from './scene-component.ts';
import type { SceneNode } from './scene-node.ts';

const sceneComponentNodes = new WeakMap<SceneComponent, SceneNode>();

export { sceneComponentNodes };
