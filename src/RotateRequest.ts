import {RequestError} from './errors.ts';

import type {Sharp} from 'sharp';
import type {Size, ImageRequest} from './ImageProcessing.ts';

export default class RotateRequest implements ImageRequest {
    private readonly request: string;
    private degrees: number = 0;
    private isMirrored: boolean = false;

    constructor(request: string) {
        this.request = request;
    }

    parseImageRequest(size: Size): void {
        let request = this.request;
        if (request.startsWith('!')) {
            request = request.substring(1);
            this.isMirrored = true;
        }

        this.degrees = parseFloat(request);
        if (isNaN(this.degrees))
            throw new RequestError(`Incorrect rotation request: ${this.request}`);

        this.degrees = Math.round(this.degrees);
        if ((this.degrees < 0) || (this.degrees >= 360))
            throw new RequestError('Degrees should be between 0 and 360');
    }

    requiresImageProcessing(): boolean {
        return this.isMirrored || (this.degrees > 0);
    }

    executeImageProcessing(image: Sharp): void {
        if (this.isMirrored) image.flop();
        if (this.degrees > 0) image.rotate(this.degrees);
    }

    shouldFlush(): boolean {
        return false;
    }
}
