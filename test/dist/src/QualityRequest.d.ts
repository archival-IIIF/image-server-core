import { Size, ImageRequest } from './ImageProcessing';
import { Sharp } from 'sharp';
export default class QualityRequest implements ImageRequest {
    private request;
    private setQuality;
    constructor(request: string);
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
}
