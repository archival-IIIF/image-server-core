import {Size, ImageRequest} from './ImageProcessing.js';
import {RequestError} from './errors.js';
import {Sharp} from 'sharp';

export default class QualityRequest implements ImageRequest {
    private setQuality: boolean = false;

    constructor(private request: string) {
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
