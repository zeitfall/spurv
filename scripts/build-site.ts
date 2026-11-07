import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { extname, join, resolve } from 'node:path';

import { listExampleNames, createExampleIndex } from './example-index.ts';

const ROOT_DIRECTORY = resolve(import.meta.dirname, '..');
const LIBRARY_DIRECTORY = join(ROOT_DIRECTORY, 'dist');
const EXAMPLES_DIRECTORY = join(ROOT_DIRECTORY, 'examples');
const SITE_DIRECTORY = join(ROOT_DIRECTORY, 'site');

const SOURCE_ENTRY = 'src/index.ts';
const LIBRARY_ENTRY = 'dist/index.js';

function isLibraryFile(path: string) {
    const fileExtension = extname(path);

    return fileExtension === '' || fileExtension === '.js';
}

async function buildExample(name: string) {
    const sourceDirectory = join(EXAMPLES_DIRECTORY, name);
    const targetDirectory = join(SITE_DIRECTORY, 'examples', name);

    await mkdir(targetDirectory, { recursive: true });

    const fileNames = await readdir(sourceDirectory);

    await Promise.all(fileNames.map((fileName) => {
        return buildExampleFile(join(sourceDirectory, fileName), join(targetDirectory, fileName));
    }));
}

async function buildExampleFile(sourcePath: string, targetPath: string) {
    const fileExtension = extname(sourcePath);

    if (fileExtension === '.ts') {
        const source = await readFile(sourcePath, 'utf8');
        const scriptPath = `${targetPath.slice(0, -fileExtension.length)}.js`;

        await writeFile(scriptPath, stripTypeScriptTypes(source));

        return;
    }

    if (fileExtension === '.html') {
        const html = await readFile(sourcePath, 'utf8');

        await writeFile(targetPath, rewriteExamplePage(html, sourcePath));

        return;
    }

    await cp(sourcePath, targetPath);
}

function rewriteExamplePage(html: string, path: string) {
    if (html.includes(SOURCE_ENTRY) === false) {
        throw new Error(
            `rewriteExamplePage: expected an import map entry for ${SOURCE_ENTRY} in ${path}, received none.`,
        );
    }

    return html.replaceAll(SOURCE_ENTRY, LIBRARY_ENTRY).replaceAll('.ts"', '.js"');
}

await rm(SITE_DIRECTORY, { recursive: true, force: true });
await cp(LIBRARY_DIRECTORY, join(SITE_DIRECTORY, 'dist'), { recursive: true, filter: isLibraryFile });

const exampleNames = await listExampleNames(EXAMPLES_DIRECTORY);

await Promise.all(exampleNames.map(buildExample));

await writeFile(join(SITE_DIRECTORY, 'index.html'), createExampleIndex(exampleNames, 'examples/'));

console.log(`build-site: ${exampleNames.length} examples in site/.`);
