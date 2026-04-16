import ImageProcessing from './ImageProcessing.ts';
import RegionRequest from './RegionRequest.ts';
import SizeRequest from './SizeRequest.ts';
import RotateRequest from './RotateRequest.ts';
import QualityRequest from './QualityRequest.ts';
import FormatRequest from './FormatRequest.ts';

export interface ImageOptions {
    region: string,
    size: string,
    rotation: string,
    quality: string,
    format: string
}

export interface ImageResult {
    image: Buffer,
    contentType: string,
    contentLength: number
}

export default async function serveImage(path: string, maxSize: number | null,
                                         options: ImageOptions): Promise<ImageResult> {
    const imageProcessing = new ImageProcessing(path, maxSize, [
        new RegionRequest(options.region),
        new SizeRequest(options.size),
        new RotateRequest(options.rotation),
        new QualityRequest(options.quality),
        new FormatRequest(options.format)
    ]);

    const processedImage = await imageProcessing.process();

    return {
        image: processedImage.data,
        contentType: getContentType(options.format),
        contentLength: processedImage.info.size
    };
}

function getContentType(extension: string): string {
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'tif':
        case 'tiff':
            return 'image/tiff';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'avif':
            return 'image/avif';
        case 'heif':
            return 'image/heif';
        default:
            return 'application/octet-stream';
    }
}
