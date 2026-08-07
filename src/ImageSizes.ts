import ImageProcessing, {type Size} from './ImageProcessing.ts';

type PageInfo = [number, number, number]; // page, width, height

export interface SourceLevel {
    page: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
}

export default class ImageSizes {
    private width?: number;
    private height?: number;
    private levels?: SourceLevel[];

    private readonly path: string;
    private readonly maxSize: number | null;
    private readonly imageProcessing: ImageProcessing;

    private static readonly pages = new Map<string, Promise<PageInfo[]>>();

    constructor(path: string, maxSize: number | null, imageProcessing: ImageProcessing) {
        this.path = path;
        this.maxSize = maxSize;
        this.imageProcessing = imageProcessing;
    }

    public async init(): Promise<void> {
        const pipeline = this.imageProcessing.getPipeline();
        const metadata = await pipeline.metadata();

        this.width = metadata.width as number;
        this.height = metadata.height as number;
        if (!metadata.pages || metadata.pages === 1) {
            this.levels = [];
            return;
        }

        if (!ImageSizes.pages.has(this.path))
            ImageSizes.pages.set(this.path, this.getPages(metadata.pages));

        const max = this.getMaxSize();
        const pages = await ImageSizes.pages.get(this.path)!;
        this.levels = pages.map(page => ({
            page: page[0],
            width: page[1],
            height: page[2],
            scaleX: page[1] / max.width,
            scaleY: page[2] / max.height,
        }));
    }

    public getMaxSize(): Size {
        if (!this.width || !this.height)
            throw new Error('Run init() first before calling getMaxSize');

        const longest = Math.max(this.width, this.height);
        if (this.maxSize && longest > this.maxSize) {
            const scale = this.maxSize / longest;
            return {width: Math.round(this.width * scale), height: Math.round(this.height * scale)};
        }

        return {width: this.width, height: this.height};
    }

    public getSourceLevel(region: Size, requested: Size): SourceLevel {
        if (!this.width || !this.height || !this.levels)
            throw new Error('Run init() first before calling getSourceLevel');

        const max = this.getMaxSize();
        const scaleX = (requested.width / region.width) / (this.width / max.width);
        const scaleY = (requested.height / region.height) / (this.height / max.height);

        if (this.levels.length > 1) {
            const levels = this.levels.filter(level =>
                level.width / this.width! >= scaleX && level.height / this.height! >= scaleY);
            return levels.at(-1) ?? this.levels[0];
        }

        return {
            page: 0,
            width: this.width,
            height: this.height,
            scaleX: this.width / max.width,
            scaleY: this.height / max.height
        };
    }

    private async getPages(noPages: number): Promise<PageInfo[]> {
        const pages: PageInfo[] = [];
        for (let page = 0; page < noPages; page++) {
            const pipeline = this.imageProcessing.getPipeline(page);
            const metadata = await pipeline.metadata();
            pages.push([page, metadata.width, metadata.height]);
        }

        pages.sort((a, b) => b[1] - a[1] || b[2] - a[2]);

        return pages;
    }
}
