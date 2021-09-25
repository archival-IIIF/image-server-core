import * as sharp from "sharp";

export function setConcurrency(concurrency?: number): number {
    return sharp.concurrency(concurrency);
}

export function getSupportedFormats(): string[] {
    return Object.keys(sharp.format);
}
