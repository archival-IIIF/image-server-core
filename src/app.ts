import {join} from 'path';

import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as morgan from 'koa-morgan';

import logger from './logger';
import serveImage from './image/imageServer';
import {NotImplementedError, RequestError} from './image/errors';

if (process.env.NODE_ENV !== 'production')
    require('dotenv').config();

const router = new Router();

router.get('/:path/:region/:size/:rotation/:quality.:format', async ctx => {
    logger.info(`Received a request for an image on path ${ctx.params.path}`);

    const path = join(process.env.IIIF_IMAGE_ROOT_PATH as string, ctx.params.path);
    const image = await serveImage(path, {
        region: ctx.params.region,
        size: ctx.params.size,
        rotation: ctx.params.rotation,
        quality: ctx.params.quality,
        format: ctx.params.format
    });

    ctx.body = image.image;
    if (image.contentType) ctx.set('Content-Type', image.contentType);
    if (image.contentLength) ctx.set('Content-Length', String(image.contentLength));
    ctx.set('Content-Disposition', `inline; filename="${ctx.params.id}-${ctx.params.region}-${ctx.params.size}-${ctx.params.rotation}-${ctx.params.quality}.${ctx.params.format}"`);

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
