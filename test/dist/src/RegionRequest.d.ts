import { Size, ImageRequest } from './ImageProcessing';
import { Sharp } from 'sharp';
export default class RegionRequest implements ImageRequest {
    private request;
    private left;
    private top;
    private width;
    private height;
    private isSquare;
    private isFull;
    private static REGION_IN_PIXELS;
    private static REGION_IN_PERCENTAGES;
    constructor(request: string);
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: Sharp): void;
}
