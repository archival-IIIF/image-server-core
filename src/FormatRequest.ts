import {NotImplementedError, RequestError} from './errors.ts';

import type {Sharp, FormatEnum, HeifOptions, OutputOptions} from 'sharp';
import type {ImageRequest} from './ImageProcessing.ts';

export default class FormatRequest implements ImageRequest {
    private readonly request: string;

    private id: keyof FormatEnum = 'jpeg';
    private formatOptions: OutputOptions = {};

    constructor(request: string) {
        this.request = request;
    }

    parseImageRequest(): void {
        switch (this.request) {
            case 'jpg':
            case 'jpeg':
                this.id = 'jpeg';
                break;
            case 'tif':
                this.id = 'tiff';
                break;
            case 'png':
            case 'webp':
            case 'avif':
                this.id = 'heif';
                this.formatOptions = {compression: 'av1'} as HeifOptions;
                break;
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

    executeImageProcessing(image: Sharp): void {
        image.toFormat(this.id, {quality: 80, ...this.formatOptions});
    }

    shouldFlush(): boolean {
        return false;
    }
}
