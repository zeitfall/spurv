import { readdir } from 'node:fs/promises';

async function listExampleNames(examplesDirectory: string) {
    const entries = await readdir(examplesDirectory, { withFileTypes: true });

    return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

function createExampleIndex(exampleNames: readonly string[], examplesUrl: string) {
    const exampleLinks = exampleNames.map((name) => `<li><a href="${examplesUrl}${name}/">${name}</a></li>`);

    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>spurv examples</title></head>',
        `<body><h1>spurv examples</h1><ul>${exampleLinks.join('')}</ul></body>`,
        '</html>',
    ].join('\n');
}

export { listExampleNames, createExampleIndex };
