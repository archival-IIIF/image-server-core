if (process.env.NODE_ENV !== 'production')
    require('dotenv').config();

import {join} from 'path';

import Koa from 'koa';
import Router from '@koa/router';
import morgan from 'koa-morgan';
import sharp from 'sharp';

import logger from './logger';
import serveImage from './image/imageServer';
import {NotImplementedError, RequestError} from './image/errors';

sharp.concurrency(process.env.IIIF_IMAGE_CONCURRENCY ? parseInt(process.env.IIIF_IMAGE_CONCURRENCY) : 0);
sharp.queue.on('change', queueLength =>
    logger.debug(`Sharp queue now contains ${queueLength} task(s)`));

logger.debug(`Sharp supports formats: ${JSON.stringify(sharp.format)}`);
logger.debug(`Sharp versions: ${JSON.stringify(sharp.versions)}`);
logger.debug(`Sharp number of threads: ${sharp.concurrency()}`);

const router = new Router();

router.get('/:path/:region/:size/:rotation/:quality.:format', async ctx => {
    logger.info(`Received a request for an image on path ${ctx.params.path}`);

    const path = join(process.env.IIIF_IMAGE_ROOT_PATH as string, ctx.params.path);
    const maxSize = Array.isArray(ctx.query.max)
        ? parseInt(ctx.query.max[0])
        : ctx.query.max
            ? parseInt(ctx.query.max) 
            : null;

    const image = await serveImage(path, maxSize, {
        region: ctx.params.region,
        size: ctx.params.size,
        rotation: ctx.params.rotation,
        quality: ctx.params.quality,
        format: ctx.params.format
    });

    ctx.body = image.image;
    if (image.contentType) ctx.set('Content-Type', image.contentType);
    if (image.contentLength) ctx.set('Content-Length', String(image.contentLength));
    ctx.set('Content-Disposition', `inline; filename="${ctx.params.path}-${ctx.params.region}-${ctx.params.size}-${ctx.params.rotation}-${ctx.params.quality}.${ctx.params.format}"`);

    logger.info(`Sending an image on path ${ctx.params.path}`);
});

const app = new Koa();

app.use(async (ctx, next) => {
    try {
        await next();
    }
    catch (err) {
        if (err instanceof RequestError) {
            ctx.status = 400;
            ctx.message = err.message;
        }
        else if (err instanceof NotImplementedError) {
            ctx.status = 501;
            ctx.message = err.message;
        }
        else {
            ctx.status = 500;
            ctx.body = 'Internal Server Error';
            ctx.app.emit('error', err, ctx);
        }
    }
});

app.on('error', (err, ctx) => {
    logger.error(`${err.status || 500} - ${ctx.method} - ${ctx.originalUrl} - ${err.message}`, {err});
});

if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    app.use(morgan('short', {'stream': logger.stream}));
}

app.use(router.routes());
app.listen(parseInt(process.env.IIIF_IMAGE_PORT as string));

logger.info('Started the image service');
