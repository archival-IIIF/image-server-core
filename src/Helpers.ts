import sharp from "sharp";
import logger from "../../image/src/logger";

export function setConcurrency(concurrency?: number): number {
    return sharp.concurrency(concurrency);
}

export function getSharp(): sharp {
    return sharp;
}

export function getSupportedFormats(): string[] {
    return Object.keys(sharp.format);
}
