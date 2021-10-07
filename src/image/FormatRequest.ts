import {Size, ImageRequest} from './ImageProcessing';
import {NotImplementedError, RequestError} from './errors';
import {
    AvifOptions,
    FormatEnum,
    HeifOptions,
    JpegOptions,
    OutputOptions,
    PngOptions,
    Sharp,
    TiffOptions,
    WebpOptions
} from 'sharp';

type OutputFormatOption =
    (OutputOptions | JpegOptions | PngOptions | WebpOptions | TiffOptions | AvifOptions | HeifOptions)
    & { id: keyof FormatEnum };

export default class FormatRequest implements ImageRequest {
    private formatOptions: OutputFormatOption = FormatRequest.OUTPUT_FORMATS.jpg;

    private static OUTPUT_FORMATS: { [name: string]: OutputFormatOption } = {
        jpg: {
            id: 'jpeg',
            quality: 80,
            progressive: false
        },
        png: {
            id: 'png',
            compressionLevel: 6,
            progressive: false
        },
        webp: {
            id: 'webp',
            quality: 80
        },
        tif: {
            id: 'tiff',
            quality: 80
        },
        avif: {
            id: 'avif',
            quality: 80
        },
        heif: {
            id: 'heif',
            quality: 80
        }
    };

    constructor(private request: string) {
    }

    parseImageRequest(size: Size): void {
        switch (this.request) {
            case 'jpg':
            case 'png':
            case 'webp':
            case 'tif':
            case 'avif':
            case 'heif':
                this.formatOptions = FormatRequest.OUTPUT_FORMATS[this.request];
                break;
            case 'gif':
            case 'jp2':
            case 'pdf':
                throw new NotImplementedError(`Format ${this.request} not supported`);
            default:
                throw new RequestError(`Incorrect format request: ${this.request}`);
        }
    }

    requiresImageProcessing(): boolean {
        return (this.formatOptions !== undefined && this.formatOptions !== null);
    }

    executeImageProcessing(image: Sharp): void {
        if (this.requiresImageProcessing()) image.toFormat(this.formatOptions.id, this.formatOptions);
    }
}
