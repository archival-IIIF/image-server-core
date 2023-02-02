import sharp from 'sharp';
import {join} from 'path';
import {parse} from 'url';
import {parseArgs} from 'util';
import {createServer} from 'http';

import serveImage from './imageServer';
import {NotImplementedError, RequestError} from './errors';

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

console.log(`Available image input formats: ${(Object.values(sharp.format) as sharp.AvailableFormatInfo[])
    .filter(format => format.input.file)
    .map(format => format.id)
    .join(', ')}`);

console.log(`Available image output formats: ${(Object.values(sharp.format) as sharp.AvailableFormatInfo[])
    .filter(format => format.output.buffer)
    .map(format => format.id)
    .join(', ')}`);

console.log(`Number of image processing threads: ${sharp.concurrency()}`);

const server = createServer(async (req, res) => {
    try {
        const parsedUrl = parse(req.url as string, true);
        const path = parsedUrl.pathname as string;
        const parts = path.substring(1).split('/');

        if (parts.length === 5 && parts[4].indexOf('.') >= 0) {
            const imagePath = decodeURIComponent(parts[0]);
            const region = parts[1];
            const size = parts[2];
            const rotation = parts[3];
            const quality = parts[4].substring(0, parts[4].indexOf('.'));
            const format = parts[4].substring(parts[4].indexOf('.') + 1);

            debug && console.log(`Received a request for an image on path ${imagePath}`);

            const path = join(root as string, imagePath);
            const maxSize = Array.isArray(parsedUrl.query.max)
                ? parseInt(parsedUrl.query.max[0])
                : parsedUrl.query.max
                    ? parseInt(parsedUrl.query.max)
                    : null;

            const image = await serveImage(path, maxSize, {region, size, rotation, quality, format});

            if (image.contentType) res.setHeader('Content-Type', image.contentType);
            if (image.contentLength) res.setHeader('Content-Length', String(image.contentLength));
            res.setHeader('Content-Disposition', `inline; filename="${imagePath}-${region}-${size}-${rotation}-${quality}.${format}"`);
            res.write(image.image);
            res.end();

            debug && console.log(`Sending an image on path ${imagePath}`);
        }
        else {
            res.writeHead(404);
            res.end();
        }
    }
    catch (err: any) {
        if (err instanceof RequestError) {
            res.writeHead(400, err.message);
            res.end();
        }
        else if (err instanceof NotImplementedError) {
            res.writeHead(501, err.message);
            res.end();
        }
        else {
            console.error(`${err.status || 500} - ${req.method} - ${req.url} - ${err.message}`, {err});
            res.writeHead(500, 'Internal Server Error');
            res.end();
        }
    }
});

const parsedPort = port && !isNaN(parseInt(port)) ? parseInt(port) : 3333;
server.listen(parsedPort, () => console.log(`Image server started on http://localhost:${parsedPort} 🚀`));
