import ImageProcessing, {type ImageOptions} from './ImageProcessing.ts';

export interface ImageResult {
    image: Buffer,
    contentType: string,
    contentLength: number
}

export default async function serveImage(path: string, maxSize: number | null,
                                         options: ImageOptions): Promise<ImageResult> {
    const imageProcessing = new ImageProcessing(path, maxSize, options);
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
