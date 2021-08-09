import { Size, ImageRequest } from './ImageProcessing';
import { Sharp } from 'sharp';
export default class SizeRequest implements ImageRequest {
    private request;
    private newSize;
    private bestFit;
    private isMax;
    private static SIZE_TO_WIDTH;
    private static SIZE_TO_HEIGHT;
    private static SIZE_TO_PERCENTAGE;
    private static SIZE_TO_WIDTH_HEIGHT;
    private static SIZE_TO_BEST_FIT;
    constructor(request: string);
    parseImageRequest(size: Size): void;
    private updateProcessingInfo;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
}
