import {
    basename,
    dirname,
    join,
} from 'node:path/posix';

type ImportRule =
    | 'cycle'
    | 'dynamic-import'
    | 'example'
    | 'gpu-access'
    | 'layer'
    | 'module-entry'
    | 'module-layer'
    | 'own-index'
    | 'testing'
    | 'type-modifier'
    | 'webgpu';

type MaskState = 'code' | 'line-comment' | 'block-comment' | '\'' | '"' | '`';

interface SourceFile {
    path: string;
    text: string;
}

interface Violation {
    path: string;
    line: number;
    rule: ImportRule;
    message: string;
}

interface ImportStatement {
    specifier: string;
    line: number;
    typeOnly: boolean;
}

interface ImportEdge {
    targetPath: string;
    line: number;
}

interface CycleSearch {
    graph: ReadonlyMap<string, readonly ImportEdge[]>;
    visitedPaths: Set<string>;
    activePaths: string[];
    violations: Violation[];
}

const ARCHITECTURE_PATH = 'docs/architecture.md';
const LAYER_SECTION_HEADING = '## Modules and layers';
const PUBLIC_PACKAGE = 'spurv';
const GPU_MODULES = Object.freeze(['gpu', 'renderer']);
const COMMENT_STATES: readonly MaskState[] = Object.freeze(['line-comment', 'block-comment']);

const LAYER_ROW_PATTERN = Object.freeze(/^\|\s*(\d+)\s*\|\s*`([a-z0-9-]+)`\s*\|/gm);
const IMPORT_PATTERN = Object.freeze(/^(import|export)(\s+type)?\b(?:[^;']*?\bfrom)?\s*'([^']*)'/gm);
const DYNAMIC_IMPORT_PATTERN = Object.freeze(/\bimport\s*\(/g);
const NAME_LIST_PATTERN = Object.freeze(/^(?:import|export)\s*\{([^}]*)\}\s*from\b/gm);
const WEBGPU_PATTERN = Object.freeze(/\bGPU(?:[A-Z]\w*)?\b|\bnavigator\.gpu\b/g);

function checkImports(files: readonly SourceFile[], architecture: string) {
    const layers = parseLayers(architecture);

    const violations: Violation[] = [];

    for (const file of files) {
        violations.push(...checkFile(file, layers));
    }

    violations.push(...checkCycles(files));
    violations.push(...checkModuleLayers(files, layers, architecture));

    return violations.sort((violationA, violationB) => {
        return violationA.path.localeCompare(violationB.path) || violationA.line - violationB.line;
    });
}

function parseLayers(architecture: string) {
    const sectionStart = architecture.indexOf(LAYER_SECTION_HEADING);

    if (sectionStart === -1) {
        throw new Error(`parseLayers: expected a "${LAYER_SECTION_HEADING}" section, received none.`);
    }

    const sectionEnd = architecture.indexOf('\n## ', sectionStart + LAYER_SECTION_HEADING.length);
    const section = architecture.slice(sectionStart, sectionEnd === -1 ? undefined : sectionEnd);

    const layers = new Map<string, number>();

    for (const match of section.matchAll(LAYER_ROW_PATTERN)) {
        layers.set(match[2], Number(match[1]));
    }

    return layers;
}

function checkFile(file: SourceFile, layers: ReadonlyMap<string, number>) {
    const maskedText = maskCommentsAndStrings(file.text);

    const fileModule = findModule(file.path);
    const fileIsLibrary = file.path.startsWith('src/');
    const fileCanUseWebGPU = fileModule !== null && GPU_MODULES.includes(fileModule);

    const violations: Violation[] = [];

    for (const match of maskedText.matchAll(DYNAMIC_IMPORT_PATTERN)) {
        violations.push({
            path: file.path,
            line: findLine(maskedText, match.index),
            rule: 'dynamic-import',
            message: 'expected a static import, received a dynamic import.',
        });
    }

    if (fileIsLibrary && fileCanUseWebGPU === false) {
        for (const match of maskedText.matchAll(WEBGPU_PATTERN)) {
            violations.push({
                path: file.path,
                line: findLine(maskedText, match.index),
                rule: 'webgpu',
                message: `expected no WebGPU API outside gpu and renderer, received ${match[0]}.`,
            });
        }
    }

    for (const match of maskedText.matchAll(NAME_LIST_PATTERN)) {
        const names = match[1].split(',').map((name) => name.trim()).filter((name) => name !== '');

        if (names.length === 0 || names.some((name) => hasTypeModifier(name) === false)) {
            continue;
        }

        violations.push({
            path: file.path,
            line: findLine(maskedText, match.index),
            rule: 'type-modifier',
            message: 'expected import type for names that are all types, received a type modifier on each name.',
        });
    }

    for (const statement of findImports(file.text)) {
        violations.push(...checkImport(file.path, statement, layers));
    }

    return violations;
}

function maskCommentsAndStrings(text: string) {
    const characters = text.split('');

    let state: MaskState = 'code';

    for (let i = 0; i < characters.length; i++) {
        const character = characters[i];
        const pair = text.slice(i, i + 2);

        if (state === 'code') {
            state = findMaskState(character, pair);

            if (COMMENT_STATES.includes(state)) {
                maskCharacter(characters, i);
                maskCharacter(characters, i + 1);
                i++;
            }
            else if (state !== 'code') {
                maskCharacter(characters, i);
            }

            continue;
        }

        const characterIsLineCommentEnd = state === 'line-comment' && character === '\n';
        const characterIsEscape = COMMENT_STATES.includes(state) === false && character === '\\';
        const characterIsClosingQuote = character === state;

        const pairIsBlockCommentEnd = state === 'block-comment' && pair === '*/';

        if (characterIsLineCommentEnd) {
            state = 'code';

            continue;
        }

        if (pairIsBlockCommentEnd) {
            maskCharacter(characters, i);
            maskCharacter(characters, i + 1);
            state = 'code';
            i++;

            continue;
        }

        if (characterIsEscape) {
            maskCharacter(characters, i);
            maskCharacter(characters, i + 1);
            i++;

            continue;
        }

        if (characterIsClosingQuote) {
            state = 'code';
        }

        maskCharacter(characters, i);
    }

    return characters.join('');
}

function findMaskState(character: string, pair: string) {
    if (pair === '//') {
        return 'line-comment';
    }

    if (pair === '/*') {
        return 'block-comment';
    }

    if (character === '\'' || character === '"' || character === '`') {
        return character;
    }

    return 'code';
}

function maskCharacter(characters: string[], index: number) {
    const characterExists = index < characters.length;
    const characterIsNewline = characters[index] === '\n';

    if (characterExists && characterIsNewline === false) {
        characters[index] = ' ';
    }
}

function findModule(path: string) {
    const [rootDirectory, moduleName, ...moduleFiles] = path.split('/');

    const pathIsInLibrary = rootDirectory === 'src' && moduleFiles.length > 0;
    const pathIsInTesting = moduleName === 'testing';

    if (pathIsInLibrary === false || pathIsInTesting) {
        return null;
    }

    return moduleName;
}

function hasTypeModifier(name: string) {
    const words = name.split(/\s+/);

    return words[0] === 'type' && words.length % 2 === 0;
}

function findLine(text: string, index: number) {
    return text.slice(0, index).split('\n').length;
}

function findImports(text: string) {
    const maskedText = maskCommentsAndStrings(text);

    const statements: ImportStatement[] = [];

    for (const match of text.matchAll(IMPORT_PATTERN)) {
        if (maskedText[match.index] !== text[match.index]) {
            continue;
        }

        statements.push({
            specifier: match[3],
            line: findLine(text, match.index),
            typeOnly: match[2] !== undefined,
        });
    }

    return statements;
}

function checkImport(importerPath: string, statement: ImportStatement, layers: ReadonlyMap<string, number>) {
    const violations: Violation[] = [];

    if (importerPath.startsWith('examples/')) {
        if (statement.specifier !== PUBLIC_PACKAGE) {
            violations.push({
                path: importerPath,
                line: statement.line,
                rule: 'example',
                message: `expected an import of '${PUBLIC_PACKAGE}' only, received '${statement.specifier}'.`,
            });
        }

        return violations;
    }

    const targetPath = resolveSpecifier(importerPath, statement.specifier);

    if (targetPath === null) {
        return violations;
    }

    const importerIsTest = importerPath.endsWith('.test.ts') || importerPath.startsWith('src/testing/');
    const targetIsTesting = targetPath.startsWith('src/testing/');

    if (targetIsTesting && importerIsTest === false) {
        violations.push({
            path: importerPath,
            line: statement.line,
            rule: 'testing',
            message: 'expected an import of src/testing from a test file, received an import from a non-test file.',
        });
    }

    const importerModule = findModule(importerPath);
    const targetModule = findModule(targetPath);

    if (targetModule === null) {
        return violations;
    }

    const targetIndexPath = `src/${targetModule}/index.ts`;

    if (importerModule === targetModule) {
        if (targetPath === targetIndexPath) {
            violations.push({
                path: importerPath,
                line: statement.line,
                rule: 'own-index',
                message: `expected a direct import of a file of ${targetModule}, received its index.ts.`,
            });
        }

        return violations;
    }

    if (targetPath !== targetIndexPath) {
        violations.push({
            path: importerPath,
            line: statement.line,
            rule: 'module-entry',
            message: `expected an import of ${targetIndexPath}, received ${targetPath}.`,
        });
    }

    if (targetModule === 'gpu' && importerModule !== 'renderer') {
        violations.push({
            path: importerPath,
            line: statement.line,
            rule: 'gpu-access',
            message: `expected an import of gpu from renderer only, received an import from ${importerPath}.`,
        });
    }

    if (importerModule === null) {
        return violations;
    }

    const importerLayer = layers.get(importerModule);
    const targetLayer = layers.get(targetModule);

    if (importerLayer === undefined || targetLayer === undefined) {
        return violations;
    }

    if (targetLayer >= importerLayer) {
        violations.push({
            path: importerPath,
            line: statement.line,
            rule: 'layer',
            message: `expected a layer below ${importerLayer}, received ${targetModule} (layer ${targetLayer}).`,
        });
    }

    return violations;
}

function resolveSpecifier(importerPath: string, specifier: string) {
    if (specifier.startsWith('.') === false) {
        return null;
    }

    return join(dirname(importerPath), specifier);
}

function checkCycles(files: readonly SourceFile[]) {
    const search: CycleSearch = {
        graph: buildRuntimeGraph(files),
        visitedPaths: new Set(),
        activePaths: [],
        violations: [],
    };

    for (const path of search.graph.keys()) {
        visitPath(path, search);
    }

    return search.violations;
}

function buildRuntimeGraph(files: readonly SourceFile[]) {
    const graph = new Map<string, ImportEdge[]>();

    for (const file of files) {
        const fileModule = findModule(file.path);

        if (fileModule === null) {
            continue;
        }

        const edges: ImportEdge[] = [];

        for (const statement of findImports(file.text)) {
            const targetPath = resolveSpecifier(file.path, statement.specifier);
            const targetIsInFileModule = targetPath !== null && findModule(targetPath) === fileModule;

            if (statement.typeOnly || targetIsInFileModule === false) {
                continue;
            }

            edges.push({ targetPath, line: statement.line });
        }

        graph.set(file.path, edges);
    }

    return graph;
}

function visitPath(path: string, search: CycleSearch) {
    if (search.visitedPaths.has(path)) {
        return;
    }

    search.visitedPaths.add(path);
    search.activePaths.push(path);

    for (const edge of search.graph.get(path) ?? []) {
        const activeIndex = search.activePaths.indexOf(edge.targetPath);

        if (activeIndex !== -1) {
            const cycleNames = [...search.activePaths.slice(activeIndex), edge.targetPath].map((cyclePath) => {
                return basename(cyclePath);
            });

            search.violations.push({
                path,
                line: edge.line,
                rule: 'cycle',
                message: `expected no cycle of runtime imports, received ${cycleNames.join(', ')}.`,
            });

            continue;
        }

        visitPath(edge.targetPath, search);
    }

    search.activePaths.pop();
}

function checkModuleLayers(files: readonly SourceFile[], layers: ReadonlyMap<string, number>, architecture: string) {
    const headingLine = findLine(architecture, architecture.indexOf(LAYER_SECTION_HEADING));

    const moduleNames = new Set(files.map((file) => findModule(file.path)).filter((name) => name !== null));

    const violations: Violation[] = [];

    for (const moduleName of moduleNames) {
        if (layers.has(moduleName)) {
            continue;
        }

        violations.push({
            path: ARCHITECTURE_PATH,
            line: headingLine,
            rule: 'module-layer',
            message: `expected a layer for module ${moduleName}, received none.`,
        });
    }

    return violations;
}

export { ARCHITECTURE_PATH, checkImports };
