import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

import { ARCHITECTURE_PATH, checkImports } from './import-rules.ts';

const ROOT_DIRECTORY = resolve(import.meta.dirname, '..');
const CHECKED_DIRECTORIES = Object.freeze(['examples', 'scripts', 'src']);

async function readSourceFiles() {
    const pathGroups = await Promise.all(CHECKED_DIRECTORIES.map(listSourcePaths));
    const paths = pathGroups.flat().sort();

    return Promise.all(paths.map(readSourceFile));
}

async function listSourcePaths(directory: string) {
    const entries = await readdir(join(ROOT_DIRECTORY, directory), { recursive: true });

    return entries
        .filter((entry) => entry.endsWith('.ts'))
        .map((entry) => [directory, ...entry.split(sep)].join('/'));
}

async function readSourceFile(path: string) {
    const text = await readFile(join(ROOT_DIRECTORY, path), 'utf8');

    return { path, text };
}

const sourceFiles = await readSourceFiles();
const architecture = await readFile(join(ROOT_DIRECTORY, ARCHITECTURE_PATH), 'utf8');
const violations = checkImports(sourceFiles, architecture);

for (const violation of violations) {
    console.error(`${violation.path}:${violation.line}: ${violation.rule}: ${violation.message}`);
}

if (violations.length > 0) {
    process.exitCode = 1;
}
else {
    console.log(`check-imports: ${sourceFiles.length} files, no violations.`);
}
