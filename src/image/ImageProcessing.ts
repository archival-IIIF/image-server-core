import * as sharp from 'sharp';

export interface ImageRequest {
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: sharp.Sharp): void;
}

export interface Size {
    width: number;
    height: number;
}

export default class ImageProcessing {
    constructor(private path: string, private maxSize: number | null, private requests: ImageRequest[]) {
    }

    async process(): Promise<{ data: Buffer, info: sharp.OutputInfo }> {
        const size = await this.getSize();
        const imageRequestSize = {width: size.width, height: size.height};
        this.requests.forEach(request => request.parseImageRequest(imageRequestSize));

        const pipeline = this.getPipeline();
        if (this.maxSize)
            pipeline.resize(size.width, size.height, {fit: 'fill'});

        if (this.requests.filter(request => request.requiresImageProcessing()).length > 0)
            this.requests.forEach(request => request.executeImageProcessing(pipeline));

        return pipeline.toBuffer({resolveWithObject: true});
    }

    private getPipeline(): sharp.Sharp {
        return sharp(this.path);
    }

    private async getSize(): Promise<Size> {
        const pipeline = this.getPipeline();
        const metadata = await pipeline.metadata();

        const width = metadata.width as number;
        const height = metadata.height as number;

        if (this.maxSize)
            return {
                width: (width > height)
                    ? this.maxSize : Math.round(width * (this.maxSize / height)),
                height: (height > width)
                    ? this.maxSize : Math.round(height * (this.maxSize / width))
            }

        return {width, height};
    }
}
