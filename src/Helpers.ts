import sharp from "sharp";

export default class Helpers {

    static setConcurrency(concurrency?: number): number {
        return sharp.concurrency(concurrency);
    }

    static getSupportedFormats(): string[] {
        return Object.keys(sharp.format);
    }
}
