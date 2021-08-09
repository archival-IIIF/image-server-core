import { Size, ImageRequest } from './ImageProcessing';
import { Sharp } from 'sharp';
export default class FormatRequest implements ImageRequest {
    private request;
    private format;
    private formatOptions;
    private static OUTPUT_FORMATS;
    constructor(request: string);
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
}
