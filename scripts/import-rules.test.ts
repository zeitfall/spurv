import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ARCHITECTURE_PATH, checkImports } from './import-rules.ts';

const ARCHITECTURE = [
    '# Architecture',
    '',
    '## Modules and layers',
    '',
    '| Layer | Module      | Responsibility | Status  |',
    '| ----- | ----------- | -------------- | ------- |',
    '| 0     | `math`      | Math           | Created |',
    '| 0     | `gpu`       | GPU            | Created |',
    '| 1     | `scene`     | Scene          | Created |',
    '| 2     | `geometry`  | Geometry       | Created |',
    '| 2     | `materials` | Materials      | Created |',
    '| 3     | `renderer`  | Renderer       | Created |',
    '',
    '## Milestones',
    '',
    '| #   | Example   | Scope           |',
    '| --- | --------- | --------------- |',
    '| 1   | `01-cube` | A rotating cube |',
].join('\n');

function findRules(files: Parameters<typeof checkImports>[0]) {
    return checkImports(files, ARCHITECTURE).map((violation) => violation.rule);
}

describe('checkImports()', () => {
    it('accepts an import of a module of a lower layer through its index', () => {
        const files = [{ path: 'src/scene/transform.ts', text: 'import { Vector3 } from \'../math/index.ts\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('reports an import of another module that bypasses its index', () => {
        const files = [{ path: 'src/scene/transform.ts', text: 'import { Vector3 } from \'../math/vector3.ts\';' }];

        assert.deepEqual(findRules(files), ['module-entry']);
    });

    it('reports an import of a module of the same layer', () => {
        const files = [{ path: 'src/geometry/box.ts', text: 'import { Material } from \'../materials/index.ts\';' }];

        assert.deepEqual(findRules(files), ['layer']);
    });

    it('reports an import of a module of a higher layer', () => {
        const files = [{ path: 'src/math/vector3.ts', text: 'import { SceneNode } from \'../scene/index.ts\';' }];

        assert.deepEqual(findRules(files), ['layer']);
    });

    it('reports an import of gpu from a module other than renderer', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'import { Device } from \'../gpu/index.ts\';' }];

        assert.deepEqual(findRules(files), ['gpu-access']);
    });

    it('accepts an import of gpu from renderer', () => {
        const files = [{ path: 'src/renderer/renderer.ts', text: 'import { Device } from \'../gpu/index.ts\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('reports an import of the own index from a file of the module', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'import { SceneNode } from \'./index.ts\';' }];

        assert.deepEqual(findRules(files), ['own-index']);
    });

    it('accepts a direct import between files of one module', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'import { SceneNode } from \'./scene-node.ts\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('accepts imports of module indexes from the public API', () => {
        const files = [{ path: 'src/index.ts', text: 'export { Vector3 } from \'./math/index.ts\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('reports an import from the public API that bypasses a module index', () => {
        const files = [{ path: 'src/index.ts', text: 'export { Vector3 } from \'./math/vector3.ts\';' }];

        assert.deepEqual(findRules(files), ['module-entry']);
    });

    it('reports an import of src/testing from a non-test file', () => {
        const files = [{ path: 'src/math/vector3.ts', text: 'import { assertClose } from \'../testing/index.ts\';' }];

        assert.deepEqual(findRules(files), ['testing']);
    });

    it('accepts an import of src/testing from a test file', () => {
        const text = 'import { assertClose } from \'../testing/index.ts\';';
        const files = [{ path: 'src/math/vector3.test.ts', text }];

        assert.deepEqual(findRules(files), []);
    });

    it('accepts imports between files of src/testing', () => {
        const files = [{ path: 'src/testing/index.ts', text: 'export { assertClose } from \'./assert-close.ts\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('accepts an import of spurv from an example', () => {
        const files = [{ path: 'examples/01-cube/main.ts', text: 'import { Vector3 } from \'spurv\';' }];

        assert.deepEqual(findRules(files), []);
    });

    it('reports an import of anything other than spurv from an example', () => {
        const files = [{ path: 'examples/01-cube/main.ts', text: 'import { Vector3 } from \'../../src/index.ts\';' }];

        assert.deepEqual(findRules(files), ['example']);
    });

    it('reports a WebGPU identifier outside gpu and renderer', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'const usage = GPUBufferUsage.VERTEX;' }];

        assert.deepEqual(findRules(files), ['webgpu']);
    });

    it('reports navigator.gpu outside gpu and renderer', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'const gpu = navigator.gpu;' }];

        assert.deepEqual(findRules(files), ['webgpu']);
    });

    it('accepts WebGPU identifiers in gpu and renderer', () => {
        const files = [
            { path: 'src/gpu/device.ts', text: 'const adapter: GPUAdapter | null = await gpu.requestAdapter();' },
            { path: 'src/gpu/context.ts', text: 'const gpu = navigator.gpu;' },
            { path: 'src/renderer/renderer.ts', text: 'const usage = GPUBufferUsage.VERTEX;' },
        ];

        assert.deepEqual(findRules(files), []);
    });

    it('accepts identifiers that contain GPU inside a word', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'const isWebGPURenderer = initGPUDevice;' }];

        assert.deepEqual(findRules(files), []);
    });

    it('ignores WebGPU identifiers in comments and strings', () => {
        const text = [
            '/**',
            ' * Holds no GPUBuffer.',
            ' */',
            '// navigator.gpu is not used here.',
            'const message = \'expected a GPUDevice\';',
            'const template = `GPUTexture ${message}`;',
        ].join('\n');

        const files = [{ path: 'src/scene/scene.ts', text }];

        assert.deepEqual(findRules(files), []);
    });

    it('ignores import statements inside strings', () => {
        const text = [
            'const source = `',
            'import { Device } from \'../gpu/index.ts\';',
            '`;',
        ].join('\n');

        const files = [{ path: 'src/scene/scene.ts', text }];

        assert.deepEqual(findRules(files), []);
    });

    it('reads multi-line and type-only imports', () => {
        const text = [
            'import {',
            '    Vector3,',
            '    Quaternion,',
            '} from \'../math/vector3.ts\';',
            '',
            'import type { Matrix4 } from \'../math/matrix4.ts\';',
        ].join('\n');

        const files = [{ path: 'src/scene/transform.ts', text }];

        assert.deepEqual(findRules(files), ['module-entry', 'module-entry']);
    });

    it('reports the line of the import', () => {
        const text = [
            'import { Vector3 } from \'../math/index.ts\';',
            '',
            'import { Matrix4 } from \'../math/matrix4.ts\';',
        ].join('\n');

        const violations = checkImports([{ path: 'src/scene/transform.ts', text }], ARCHITECTURE);

        assert.equal(violations.length, 1);
        assert.equal(violations[0].line, 3);
    });

    it('reports a dynamic import', () => {
        const files = [{ path: 'src/scene/scene.ts', text: 'const math = await import(\'../math/index.ts\');' }];

        assert.deepEqual(findRules(files), ['dynamic-import']);
    });

    it('reports a cycle of runtime imports within a module', () => {
        const files = [
            { path: 'src/scene/scene.ts', text: 'import { SceneNode } from \'./scene-node.ts\';' },
            { path: 'src/scene/scene-node.ts', text: 'import { Scene } from \'./scene.ts\';' },
        ];

        assert.deepEqual(findRules(files), ['cycle']);
    });

    it('lists the files of a cycle in import order', () => {
        const files = [
            { path: 'src/scene/scene.ts', text: 'import { SceneNode } from \'./scene-node.ts\';' },
            { path: 'src/scene/scene-node.ts', text: 'import { Transform } from \'./transform.ts\';' },
            { path: 'src/scene/transform.ts', text: 'import { Scene } from \'./scene.ts\';' },
        ];

        const violations = checkImports(files, ARCHITECTURE);

        assert.equal(violations.length, 1);
        assert.equal(
            violations[0].message,
            'expected no cycle of runtime imports, received scene.ts, scene-node.ts, transform.ts, scene.ts.',
        );
    });

    it('ignores a cycle closed by a type-only import', () => {
        const files = [
            { path: 'src/scene/scene.ts', text: 'import { SceneNode } from \'./scene-node.ts\';' },
            { path: 'src/scene/scene-node.ts', text: 'import type { Scene } from \'./scene.ts\';' },
        ];

        assert.deepEqual(findRules(files), []);
    });

    it('reports a module that has no layer in the architecture document', () => {
        const files = [{ path: 'src/physics/index.ts', text: '' }];

        const violations = checkImports(files, ARCHITECTURE);

        assert.deepEqual(
            violations.map((violation) => [violation.path, violation.line, violation.rule]),
            [[ARCHITECTURE_PATH, 3, 'module-layer']],
        );
    });

    it('reads layers only from the modules section of the architecture document', () => {
        const files = [{ path: 'src/01-cube/index.ts', text: '' }];

        assert.deepEqual(findRules(files), ['module-layer']);
    });

    it('throws when the architecture document has no modules section', () => {
        assert.throws(() => checkImports([], '# Architecture'), Error);
    });
});
