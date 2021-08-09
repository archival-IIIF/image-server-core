/// <reference types="node" />
import * as sharp from 'sharp';
export interface ImageRequest {
    parseImageRequest(size: Size): void;
    requiresImageProcessing(): boolean;
    executeImageProcessing(image: sharp.Sharp): void;
}
export interface Size {
    width: number;
    height: number;
}
export default class ImageProcessing {
    private path;
    private maxSize;
    private requests;
    constructor(path: string, maxSize: number | null, requests: ImageRequest[]);
    process(): Promise<{
        data: Buffer;
        info: sharp.OutputInfo;
    }>;
    private getPipeline;
    private getSize;
}
