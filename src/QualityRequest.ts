import {RequestError} from './errors.ts';

import type {Sharp} from 'sharp';
import type {ImageRequest} from './ImageProcessing.ts';

export default class QualityRequest implements ImageRequest {
    private readonly request: string;

    constructor(request: string) {
        this.request = request;
    }

    parseImageRequest(): void {
        if (!['color', 'default', 'gray', 'bitonal'].includes(this.request))
            throw new RequestError(`Incorrect quality request: ${this.request}`);
    }

    executeImageProcessing(image: Sharp): void {
        if (this.request === 'gray')
            image.gamma().grayscale();
        else if (this.request === 'bitonal')
            image.threshold();
    }

    shouldFlush(): boolean {
        return false;
    }
}
