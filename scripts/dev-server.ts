import { watch } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { stripTypeScriptTypes } from 'node:module';
import { extname, join, relative, resolve, sep } from 'node:path';

import type { Stats } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';

const ROOT_DIRECTORY = resolve(import.meta.dirname, '..');
const SERVED_DIRECTORIES = Object.freeze(['examples', 'src']);
const PORT = Number(process.env.PORT ?? 8000);

const RELOAD_PATH = '/__reload';
const RELOAD_DELAY_MILLISECONDS = 50;
const RELOAD_SCRIPT = `<script type="module">new EventSource('${RELOAD_PATH}').onmessage = () => location.reload();</script>`;

const CONTENT_TYPES: Readonly<Record<string, string>> = Object.freeze({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ts': 'text/javascript; charset=utf-8',
    '.wgsl': 'text/plain; charset=utf-8',
});

const reloadClients = new Set<ServerResponse>();

let reloadTimer: ReturnType<typeof setTimeout> | undefined;

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');

    if (pathname === RELOAD_PATH) {
        openReloadStream(response);

        return;
    }

    if (pathname === '/') {
        await sendExampleIndex(response);

        return;
    }

    const filePath = resolve(ROOT_DIRECTORY, `.${pathname}`);
    const fileDirectory = relative(ROOT_DIRECTORY, filePath).split(sep)[0] ?? '';

    if (SERVED_DIRECTORIES.includes(fileDirectory) === false) {
        sendText(response, 404, 'Not found.');

        return;
    }

    const fileStats = await findStats(filePath);

    if (fileStats === null) {
        sendText(response, 404, 'Not found.');

        return;
    }

    if (fileStats.isDirectory()) {
        await sendDirectory(response, pathname, filePath);

        return;
    }

    await sendFile(response, filePath);
}

function openReloadStream(response: ServerResponse) {
    response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
    });
    response.flushHeaders();

    reloadClients.add(response);

    response.on('close', () => {
        reloadClients.delete(response);
    });
}

async function sendExampleIndex(response: ServerResponse) {
    const entries = await readdir(join(ROOT_DIRECTORY, 'examples'), { withFileTypes: true });

    const exampleNames = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    const exampleLinks = exampleNames.map((name) => `<li><a href="/examples/${name}/">${name}</a></li>`);

    const html = [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>spurv examples</title></head>',
        `<body><h1>spurv examples</h1><ul>${exampleLinks.join('')}</ul></body>`,
        '</html>',
    ].join('\n');

    sendBody(response, CONTENT_TYPES['.html'], injectReloadScript(html));
}

async function findStats(path: string): Promise<Stats | null> {
    try {
        return await stat(path);
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw error;
    }
}

async function sendDirectory(response: ServerResponse, pathname: string, directoryPath: string) {
    if (pathname.endsWith('/') === false) {
        response.writeHead(301, { Location: `${pathname}/` });
        response.end();

        return;
    }

    const indexPath = join(directoryPath, 'index.html');
    const indexStats = await findStats(indexPath);

    if (indexStats === null) {
        sendText(response, 404, 'Not found.');

        return;
    }

    await sendFile(response, indexPath);
}

async function sendFile(response: ServerResponse, filePath: string) {
    const fileExtension = extname(filePath);
    const contentType = CONTENT_TYPES[fileExtension] ?? 'application/octet-stream';

    if (fileExtension === '.ts') {
        const source = await readFile(filePath, 'utf8');

        sendBody(response, contentType, stripTypeScriptTypes(source));

        return;
    }

    if (fileExtension === '.html') {
        const source = await readFile(filePath, 'utf8');

        sendBody(response, contentType, injectReloadScript(source));

        return;
    }

    sendBody(response, contentType, await readFile(filePath));
}

function injectReloadScript(html: string) {
    return html.replace('</body>', `${RELOAD_SCRIPT}</body>`);
}

function sendText(response: ServerResponse, statusCode: number, text: string) {
    response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(text);
}

function sendBody(response: ServerResponse, contentType: string, body: string | Buffer) {
    response.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
    });
    response.end(body);
}

function scheduleReload() {
    clearTimeout(reloadTimer);

    reloadTimer = setTimeout(reloadPages, RELOAD_DELAY_MILLISECONDS);
}

function reloadPages() {
    for (const client of reloadClients) {
        client.write('data: reload\n\n');
    }
}

const server = createServer((request, response) => {
    handleRequest(request, response).catch((error: unknown) => {
        console.error(error);

        if (response.headersSent) {
            response.end();

            return;
        }

        sendText(response, 500, String(error));
    });
});

for (const directory of SERVED_DIRECTORIES) {
    watch(join(ROOT_DIRECTORY, directory), { recursive: true }, scheduleReload);
}

server.listen(PORT, 'localhost', () => {
    console.log(`spurv examples: http://localhost:${PORT}/`);
});
