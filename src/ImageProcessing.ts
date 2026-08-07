import sharp, {type Sharp, type SharpOptions, type OutputInfo} from 'sharp';
import ImageSizes from './ImageSizes.ts';
import RegionRequest from "./RegionRequest.ts";
import SizeRequest from "./SizeRequest.ts";
import RotateRequest from "./RotateRequest.ts";
import QualityRequest from "./QualityRequest.ts";
import FormatRequest from "./FormatRequest.ts";

export interface ImageRequest {
    parseImageRequest(): void;

    executeImageProcessing(image: Sharp): void;

    shouldFlush(): boolean;
}

export interface ImageOptions {
    region: string,
    size: string,
    rotation: string,
    quality: string,
    format: string
}

export interface Size {
    width: number;
    height: number;
}

export default class ImageProcessing {
    private readonly path: string;
    private readonly sizes: ImageSizes;

    private readonly region: RegionRequest;
    private readonly size: SizeRequest;
    private readonly rotate: RotateRequest;
    private readonly quality: QualityRequest;
    private readonly format: FormatRequest;

    constructor(path: string, maxSize: number | null, options: ImageOptions) {
        this.path = path;
        this.sizes = new ImageSizes(path, maxSize, this);

        this.region = new RegionRequest(options.region);
        this.size = new SizeRequest(options.size);
        this.rotate = new RotateRequest(options.rotation);
        this.quality = new QualityRequest(options.quality);
        this.format = new FormatRequest(options.format);
    }

    async process(): Promise<{ data: Buffer, info: OutputInfo }> {
        await this.sizes.init();

        this.region.setSize(this.sizes.getMaxSize());
        this.region.parseImageRequest();

        this.size.setSize(this.region.getRegionSize());
        this.size.parseImageRequest()

        this.rotate.parseImageRequest();
        this.quality.parseImageRequest();
        this.format.parseImageRequest();

        const level = this.sizes.getSourceLevel(this.region.getRegionSize(), this.size.getNewSize());
        this.region.setSource(level);

        const region = this.region.getRegionSize();
        this.size.setSourceSize({
            width: Math.ceil(region.width * level.scaleX),
            height: Math.ceil(region.height * level.scaleY)
        });

        let pipeline = this.getPipeline(level.page);
        for (const request of [this.region, this.size, this.rotate, this.quality, this.format]) {
            request.executeImageProcessing(pipeline);
            if (request.shouldFlush())
                pipeline = await ImageProcessing.flushPipeline(pipeline);
        }

        return pipeline.toBuffer({resolveWithObject: true});
    }

    getPipeline(page?: number): Sharp {
        return ImageProcessing.getPipelineFor(this.path, {page});
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
