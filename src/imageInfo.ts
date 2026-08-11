import sharp from 'sharp';

export default async function getImageInfo(path: string, id: string, maxSize: number | null) {
    const metadata = await sharp(path, {page: 0, failOn: 'none', limitInputPixels: false}).metadata();
    if (!metadata.width || !metadata.height)
        throw new Error('Image metadata has no dimensions');

    const size = getMaxSize(metadata.width, metadata.height, maxSize);
    const pages = await getPyramidPages(path, metadata.pages ?? 1);

    return {
        '@context': 'http://iiif.io/api/image/3/context.json',
        id,
        type: 'ImageService3',
        protocol: 'http://iiif.io/api/image',
        profile: 'level2',
        width: size.width,
        height: size.height,
        sizes: getSizes(pages, size),
        preferredFormats: ['jpg', 'webp', 'avif'],
        extraFormats: ['png', 'tif', 'heif'],
        extraQualities: ['color', 'gray', 'bitonal'],
        extraFeatures: ['rotationArbitrary', 'mirroring'],
        tiles: [{width: 512, scaleFactors: getScaleFactors(pages, size)}]
    };
}

function getMaxSize(width: number, height: number, maxSize: number | null) {
    const longest = Math.max(width, height);
    if (!maxSize || longest <= maxSize)
        return {width, height};

    const scale = maxSize / longest;
    return {width: Math.round(width * scale), height: Math.round(height * scale)};
}

interface PageSize {
    width: number;
    height: number;
}

async function getPyramidPages(path: string, pages: number): Promise<PageSize[]> {
    const dimensions: PageSize[] = [];
    for (let page = 0; page < pages; page++) {
        const metadata = await sharp(path, {page, failOn: 'none', limitInputPixels: false}).metadata();
        if (metadata.width && metadata.height)
            dimensions.push({width: metadata.width, height: metadata.height});
    }
    return dimensions;
}

function getSizes(pages: PageSize[], size: PageSize): PageSize[] {
    const sizes = new Map<string, PageSize>();
    for (const page of pages) {
        const scale = Math.min(1, size.width / page.width, size.height / page.height);
        const width = Math.round(page.width * scale);
        const height = Math.round(page.height * scale);
        sizes.set(`${width}x${height}`, {width, height});
    }
    return [...sizes.values()].sort((a, b) => a.width - b.width || a.height - b.height);
}

function getScaleFactors(pages: PageSize[], size: PageSize): number[] {
    const factors = new Set<number>();
    for (const page of pages)
        factors.add(Math.max(1, Math.round(Math.max(size.width / page.width, size.height / page.height))));
    return [...factors].sort((a, b) => a - b);
}
