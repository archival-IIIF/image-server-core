import sharp, {Sharp, SharpOptions} from 'sharp';

export interface ImageRequest {
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
    shouldFlush(): boolean;
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

        let pipeline = this.getPipeline();
        if (this.maxSize && (size.width === this.maxSize || size.height === this.maxSize)) {
            pipeline.resize(size.width, size.height, {fit: 'fill'});
            pipeline = await ImageProcessing.flushPipeline(pipeline);
        }

        if (this.requests.filter(request => request.requiresImageProcessing()).length > 0) {
            for (const request of this.requests) {
                request.executeImageProcessing(pipeline);
                if (request.shouldFlush())
                    pipeline = await ImageProcessing.flushPipeline(pipeline);
            }
        }

        return pipeline.toBuffer({resolveWithObject: true});
    }

    private getPipeline(): Sharp {
        return ImageProcessing.getPipelineFor(this.path);
    }

    private async getSize(): Promise<Size> {
        const pipeline = this.getPipeline();
        const metadata = await pipeline.metadata();

        const width = metadata.width as number;
        const height = metadata.height as number;

        if (this.maxSize && width > height && width > this.maxSize)
            return {width: this.maxSize, height: Math.round(height * (this.maxSize / width))};

        if (this.maxSize && height > width && height > this.maxSize)
            return {width: Math.round(width * (this.maxSize / height)), height: this.maxSize};

        return {width, height};
    }

    private static async flushPipeline(pipeline: Sharp): Promise<Sharp> {
        const {data, info} = await pipeline.raw().toBuffer({resolveWithObject: true});
        return ImageProcessing.getPipelineFor(data, {raw: info});
    }

    private static getPipelineFor(input: string | Buffer, options?: SharpOptions): Sharp {
        return sharp(input, {
            ...options,
            failOn: 'none',
            limitInputPixels: false
        });
    }
}
