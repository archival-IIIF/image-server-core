import {RequestError} from './errors.ts';

import type {Sharp, FitEnum} from 'sharp';
import type {Size, ImageRequest} from './ImageProcessing.ts';

export default class SizeRequest implements ImageRequest {
    private readonly request: string;
    private size: Size = {width: 0, height: 0};

    private width: number | null = null;
    private height: number | null = null;
    private bestFit = false;
    private isMax = false;
    private resolvedSize?: Size;
    private sourceSize?: Size;

    private static SIZE_TO_WIDTH = /^([0-9]+),$/;
    private static SIZE_TO_HEIGHT = /^,([0-9]+)$/;
    private static SIZE_TO_PERCENTAGE = /^pct:([0-9]+\.?[0-9]*)$/;
    private static SIZE_TO_WIDTH_HEIGHT = /^([0-9]+),([0-9]+)$/;
    private static SIZE_TO_BEST_FIT = /^!([0-9]+),([0-9]+)$/;

    constructor(request: string) {
        this.request = request;
    }

    setSize(size: Size): void {
        this.size = size;
    }

    setSourceSize(size: Size): void {
        this.sourceSize = size;
    }

    getNewSize(): Size {
        return this.resolvedSize ?? this.size;
    }

    parseImageRequest(): void {
        if (this.request === 'full' || this.request === 'max') {
            this.isMax = true;
        } else {
            let result;
            if ((result = SizeRequest.SIZE_TO_WIDTH.exec(this.request)) !== null) {
                [, this.width] = result.map(i => parseInt(i));
                this.isMax = (this.width === this.size.width);
            } else if ((result = SizeRequest.SIZE_TO_HEIGHT.exec(this.request)) !== null) {
                [, this.height] = result.map(i => parseInt(i));
                this.isMax = (this.height === this.size.height);
            } else if ((result = SizeRequest.SIZE_TO_PERCENTAGE.exec(this.request)) !== null) {
                [, this.width] = result.map(i => Math.round((this.size.width / 100) * parseFloat(i)));
                this.isMax = (this.width === this.size.width);
            } else if ((result = SizeRequest.SIZE_TO_WIDTH_HEIGHT.exec(this.request)) !== null) {
                [, this.width, this.height] = result.map(i => parseInt(i));
                this.isMax = (this.width === this.size.width) && (this.height === this.size.height);
            } else if ((result = SizeRequest.SIZE_TO_BEST_FIT.exec(this.request)) !== null) {
                [, this.width, this.height] = result.map(i => parseInt(i));
                const isMaxWidth = (this.size.width > this.size.height) &&
                    (this.size.width === this.width);
                const isMaxHeight = (this.size.height > this.size.width) &&
                    (this.size.height === this.height);
                this.isMax = isMaxWidth || isMaxHeight;
                this.bestFit = true;
            } else
                throw new RequestError(`Incorrect region request: ${this.request}`);

            if ((this.width === 0) || (this.height === 0))
                throw new RequestError('Size width and/or height should not be zero');
        }

        this.resolvedSize = this.resolveSize();
        this.isMax = this.resolvedSize.width === this.size.width && this.resolvedSize.height === this.size.height;
    }

    private resolveSize(): Size {
        if (this.width && this.height && this.bestFit) {
            const newWidth = Math.round(this.size.width * this.height / this.size.height);
            const newHeight = Math.round(this.size.height * this.width / this.size.width);

            if (newWidth < this.width)
                return {width: newWidth, height: Math.round(this.size.height * newWidth / this.size.width)};

            return {width: Math.round(this.size.width * newHeight / this.size.height), height: newHeight};
        }

        if (this.width && this.height)
            return {width: this.width, height: this.height};

        if (this.width && !this.height)
            return {width: this.width, height: Math.round(this.size.height * this.width / this.size.width)};

        if (this.height && !this.width)
            return {width: Math.round(this.size.width * this.height / this.size.height), height: this.height};

        return this.size;
    }

    executeImageProcessing(image: Sharp): void {
        if (!this.isMax) {
            let fit: keyof FitEnum = 'contain';
            if (this.width && this.height) fit = 'fill';
            if (this.bestFit) fit = 'inside';
            image.resize(this.width, this.height, {fit});
        } else if (this.sourceSize && this.resolvedSize &&
            (this.sourceSize.width !== this.resolvedSize.width || this.sourceSize.height !== this.resolvedSize.height)) {
            image.resize(this.resolvedSize.width, this.resolvedSize.height, {fit: 'fill'});
        }
    }

    shouldFlush(): boolean {
        return false;
    }
}
