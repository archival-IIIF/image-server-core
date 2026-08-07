import {RequestError} from './errors.ts';

import type {Sharp} from 'sharp';
import type {SourceLevel} from './ImageSizes.ts';
import type {Size, ImageRequest} from './ImageProcessing.ts';

export default class RegionRequest implements ImageRequest {
    private readonly request: string;
    private size: Size = {width: 0, height: 0};
    private source?: SourceLevel;

    private left: number = 0;
    private top: number = 0;
    private width: number = 0;
    private height: number = 0;
    private isSquare = false;
    private isFull = false;

    private static REGION_IN_PIXELS =
        /^([0-9]+),([0-9]+),([0-9]+),([0-9]+)$/;
    private static REGION_IN_PERCENTAGES =
        /^pct:([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*),([0-9]+\.?[0-9]*)$/;

    constructor(request: string) {
        this.request = request;
    }

    setSize(size: Size): void {
        this.size = size;
    }

    setSource(source: SourceLevel): void {
        this.source = source;
    }

    getRegionSize(): Size {
        return {width: this.width, height: this.height};
    }

    parseImageRequest(): void {
        if (this.request === 'full') {
            this.isFull = true;
            this.width = this.size.width;
            this.height = this.size.height;
            return;
        }

        if (this.request === 'square') {
            this.isSquare = true;

            if (this.size.width === this.size.height) {
                this.isFull = true;
                this.width = this.size.width;
                this.height = this.size.height;
            } else {
                const shortestDimension = Math.min(this.size.width, this.size.height);
                this.width = shortestDimension;
                this.height = shortestDimension;
            }

            return;
        }

        let result;
        if ((result = RegionRequest.REGION_IN_PIXELS.exec(this.request)) !== null) {
            [, this.left, this.top, this.width, this.height] = result.map(i => parseInt(i));
        } else if ((result = RegionRequest.REGION_IN_PERCENTAGES.exec(this.request)) !== null) {
            [, this.left, , this.width] = result.map(i => Math.round((this.size.width / 100) * parseFloat(i)));
            [, , this.top, , this.height] = result.map(i => Math.round((this.size.height / 100) * parseFloat(i)));
        } else
            throw new RequestError(`Incorrect region request: ${this.request}`);

        if (this.left < 0) this.left = 0;
        if (this.top < 0) this.top = 0;

        if ((this.width + this.left) > this.size.width) this.width = this.size.width - this.left;
        if ((this.height + this.top) > this.size.height) this.height = this.size.height - this.top;

        if ((this.width === 0) || (this.height === 0))
            throw new RequestError('Region width and/or height should not be zero');

        if ((this.left > this.size.width) || (this.top > this.size.height))
            throw new RequestError('Region is entirely outside the bounds');

        const isUpperLeftCorner = ((this.left === 0) && (this.top === 0));
        const isFullWidthAndHeight = ((this.width === this.size.width) && (this.height === this.size.height));
        if (isUpperLeftCorner && isFullWidthAndHeight)
            this.isFull = true;
    }

    executeImageProcessing(image: Sharp): void {
        if (!this.isFull) {
            const source = this.source ?? {
                input: {page: 0}, width: this.size.width, height: this.size.height, scaleX: 1, scaleY: 1
            };

            const left = Math.min(Math.max(Math.floor(this.left * source.scaleX), 0), source.width);
            const top = Math.min(Math.max(Math.floor(this.top * source.scaleY), 0), source.height);
            const width = Math.min(Math.max(Math.ceil(this.width * source.scaleX), 0), source.width);
            const height = Math.min(Math.max(Math.ceil(this.height * source.scaleY), 0), source.height);

            if (this.isSquare)
                image.resize(width, height, {fit: 'cover', position: 'attention'});
            else
                image.extract({left, top, width, height});
        }
    }

    shouldFlush(): boolean {
        return this.isSquare;
    }
}
