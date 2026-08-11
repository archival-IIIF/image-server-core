import sharp from 'sharp';
import {URL} from 'node:url';
import {join} from 'node:path';
import {parseArgs} from 'node:util';
import {readFileSync} from 'node:fs';
import {createServer, IncomingMessage, ServerResponse} from 'node:http';

import serveImage from './imageServer.ts';
import getImageInfo from './imageInfo.ts';
import {NotImplementedError, RequestError} from './errors.ts';

const viewerHtml = readFileSync(new URL('./viewer.html', import.meta.url), 'utf8');

const {values: {debug, port, root, concurrency}} = parseArgs({
    options: {
        debug: {
            type: 'boolean',
            short: 'd',
            multiple: false,
            default: false
        },
        port: {
            type: 'string',
            short: 'p',
            multiple: false
        },
        root: {
            type: 'string',
            short: 'r',
            multiple: false
        },
        concurrency: {
            type: 'string',
            short: 'c',
            multiple: false
        },
    },
});

sharp.concurrency(concurrency && !isNaN(parseInt(concurrency)) ? parseInt(concurrency) : 0);

if (debug)
    sharp.queue.on('change', queueLength =>
        console.log(`Image queue now contains ${queueLength} task(s)`));

console.log('Dependencies:');
console.table(sharp.versions);

console.log(`Available image input formats: ${(Object.values(sharp.format))
    .filter(format => format.input.file)
    .map(format => format.id)
    .join(', ')}`);

console.log(`Available image output formats: ${(Object.values(sharp.format))
    .filter(format => format.output.buffer)
    .map(format => format.id)
    .join(', ')}`);

console.log(`Number of image processing threads: ${sharp.concurrency()}`);

async function requestImage(parsedUrl: URL, parts: string[], res: ServerResponse) {
    const imagePath = decodeURIComponent(parts[0]);
    const region = parts[1];
    const size = parts[2];
    const rotation = parts[3];
    const quality = parts[4].substring(0, parts[4].indexOf('.'));
    const format = parts[4].substring(parts[4].indexOf('.') + 1);

    debug && console.log(`Received a request for an image on path ${imagePath}`);

    const path = join(root as string, imagePath);
    const maxSize = getMaxSize(parsedUrl);

    const image = await serveImage(path, maxSize, {region, size, rotation, quality, format});

    if (image.contentType) res.setHeader('Content-Type', image.contentType);
    if (image.contentLength) res.setHeader('Content-Length', String(image.contentLength));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.setHeader('Content-Disposition', `inline; filename="${imagePath}-${region}-${size}-${rotation}-${quality}.${format}"`);
    res.write(image.image);
    res.end();

    debug && console.log(`Sending an image on path ${imagePath}`);
}

async function requestInfo(imagePath: string, parsedUrl: URL, req: IncomingMessage, res: ServerResponse) {
    const path = join(root as string, imagePath);
    const origin = `http://${req.headers.host ?? 'localhost'}`;
    const id = `${origin}/${encodeURI(imagePath)}`;
    const info = await getImageInfo(path, id, getMaxSize(parsedUrl));

    res.writeHead(200, {
        'Content-Type': 'application/ld+json;profile="http://iiif.io/api/image/3/context.json"',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(info));
}

function getMaxSize(parsedUrl: URL): number | null {
    const maxValue = parsedUrl.searchParams.get('max');
    if (maxValue !== null && (!/^\d+$/.test(maxValue) || !Number.isSafeInteger(Number(maxValue)) || Number(maxValue) <= 0))
        throw new RequestError('max must be a finite positive integer');
    return maxValue !== null ? Number(maxValue) : null;
}

function requestViewer(res: ServerResponse) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(viewerHtml);
}

const server = createServer(async (req, res) => {
    try {
        const parsedUrl = new URL(`http:/localhost${req.url}`);
        const parts = parsedUrl.pathname.substring(1).split('/');

        if (parts.length === 1 && parts[0] === 'viewer') {
            requestViewer(res);
        } else if (parts.length === 2 && parts[1] === 'info.json') {
            await requestInfo(decodeURIComponent(parts[0]), parsedUrl, req, res);
        } else if (parts.length === 5 && parts[4].indexOf('.') >= 0) {
            await requestImage(parsedUrl, parts, res);
        } else if (parts.length === 1 && parts[0].trim().length > 0) {
            res.writeHead(302, {'Location': parsedUrl.pathname! + '/info.json'});
            res.end();
        } else {
            res.writeHead(404);
            res.end();
        }
    } catch (err: any) {
        if (err instanceof RequestError) {
            res.writeHead(400, err.message);
            res.end();
        } else if (err instanceof NotImplementedError) {
            res.writeHead(501, err.message);
            res.end();
        } else {
            console.error(`${err.status || 500} - ${req.method} - ${req.url} - ${err.message}`, {err});
            res.writeHead(500, 'Internal Server Error');
            res.end();
        }
    }
});

const parsedPort = port && !isNaN(parseInt(port)) ? parseInt(port) : 3333;
server.listen(parsedPort, () => console.log(`Image server started on http://localhost:${parsedPort} 🚀`));
