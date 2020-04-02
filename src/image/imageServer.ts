import ImageProcessing from './ImageProcessing';
import RegionRequest from './RegionRequest';
import SizeRequest from './SizeRequest';
import RotateRequest from './RotateRequest';
import QualityRequest from './QualityRequest';
import FormatRequest from './FormatRequest';

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

export default async function serveImage(path: string, options: ImageOptions): Promise<ImageResult> {
    const imageProcessing = new ImageProcessing(path, [
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
        default:
            return 'application/octet-stream';
    }
}
