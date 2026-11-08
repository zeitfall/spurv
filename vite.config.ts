import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig } from 'vite';

const ROOT_DIRECTORY = import.meta.dirname;

const LIBRARY_ENTRY = join(ROOT_DIRECTORY, 'src', 'index.ts');

const EXAMPLES_DIRECTORY = join(ROOT_DIRECTORY, 'examples');
const EXAMPLES_OUTPUT_DIRECTORY = join(ROOT_DIRECTORY, 'dist', 'examples');
const EXAMPLES_PAGE_FILE_NAME = 'index.html';

function collectPagePaths() {
    const pagePaths: Record<string, string> = {
        index: join(EXAMPLES_DIRECTORY, EXAMPLES_PAGE_FILE_NAME),
    };

    const exampleDirectories = readdirSync(EXAMPLES_DIRECTORY, { withFileTypes: true })
        .filter((entry) => entry.isDirectory());

    for (const directory of exampleDirectories) {
        pagePaths[directory.name] = join(EXAMPLES_DIRECTORY, directory.name, EXAMPLES_PAGE_FILE_NAME);
    }

    return pagePaths;
}

const viteConfig = defineConfig({
    root: EXAMPLES_DIRECTORY,
    base: './',
    resolve: {
        alias: {
            spurv: LIBRARY_ENTRY,
        },
    },
    build: {
        outDir: EXAMPLES_OUTPUT_DIRECTORY,
        emptyOutDir: true,
        rolldownOptions: {
            input: collectPagePaths(),
        },
    },
});

export { viteConfig as default };
