import {RequestError} from './errors.ts';

import type {Sharp} from 'sharp';
import type {Size, ImageRequest} from './ImageProcessing.ts';

export default class QualityRequest implements ImageRequest {
    private readonly request: string;
    private setQuality: boolean = false;

    constructor(request: string) {
        this.request = request;
    }

    parseImageRequest(size: Size): void {
        switch (this.request) {
            case 'color':
            case 'default':
                this.setQuality = false;
                break;
            case 'gray':
            case 'bitonal':
                this.setQuality = true;
                break;
            default:
                throw new RequestError(`Incorrect quality request: ${this.request}`);
        }
    }

    requiresImageProcessing(): boolean {
        return this.setQuality;
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
