import {NotImplementedError, RequestError} from './errors.ts';

import type {Sharp, FormatEnum} from 'sharp';
import type {Size, ImageRequest} from './ImageProcessing.ts';

export default class FormatRequest implements ImageRequest {
    private readonly request: string;
    private id: keyof FormatEnum = 'jpg';

    constructor(request: string) {
        this.request = request;
    }

    parseImageRequest(size: Size): void {
        switch (this.request) {
            case 'jpg':
            case 'png':
            case 'webp':
            case 'tif':
            case 'avif':
            case 'heif':
                this.id = this.request;
                break;
            case 'gif':
            case 'jp2':
            case 'pdf':
                throw new NotImplementedError(`Format ${this.request} not supported`);
            default:
                throw new RequestError(`Incorrect format request: ${this.request}`);
        }
    }

    requiresImageProcessing(): boolean {
        return true;
    }

    executeImageProcessing(image: Sharp): void {
        if (this.requiresImageProcessing()) image.toFormat(this.id, {quality: 80});
    }

    shouldFlush(): boolean {
        return false;
    }
}
