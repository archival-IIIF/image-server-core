import { Size, ImageRequest } from './ImageProcessing';
import { Sharp } from 'sharp';
export default class RotateRequest implements ImageRequest {
    private request;
    private degrees;
    private isMirrored;
    constructor(request: string);
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
}
