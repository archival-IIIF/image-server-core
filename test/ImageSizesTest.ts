import {expect} from 'chai';
import ImageSizes from '../src/ImageSizes.ts';

const metadata = (width: number, height: number, pages?: number) => ({metadata: async () => ({width, height, pages})});

describe('ImageSizes', () => {
    it('picks the highest resolution when the full region and max size is requested and no maxSize is configured', async () => {
        const imageProcessing = {getPipeline: () => metadata(1000, 500)} as any;
        const sizes = new ImageSizes('/single.tif', null, imageProcessing);
        await sizes.init();

        expect(sizes.getSourceLevel({width: 1000, height: 500}, {width: 1000, height: 500}))
            .to.deep.include({page: 0, width: 1000, height: 500, scaleX: 1, scaleY: 1});
    });

    it('picks the smallest sufficient pyramid page for the requested ranges and sizes', async () => {
        const imageProcessing = {
            getPipeline: (page?: number) => {
                if (page === 1) return metadata(512, 512);
                if (page === 2) return metadata(256, 256);
                return metadata(1024, 1024, 3);
            }
        } as any;
        const sizes = new ImageSizes('/pyramid.tif', null, imageProcessing);
        await sizes.init();

        expect(sizes.getSourceLevel({width: 512, height: 512}, {width: 512, height: 512}).page).to.equal(0);
        expect(sizes.getSourceLevel({width: 512, height: 512}, {width: 256, height: 256}).page).to.equal(1);
    });

    it('picks the smallest sufficient pyramid page for the requested ranges and sizes when a maxSize is configured', async () => {
        const imageProcessing = {
            getPipeline: (page?: number) => {
                if (page === 1) return metadata(5000, 2500);
                if (page === 2) return metadata(2500, 1250);
                return metadata(10000, 5000, 3);
            }
        } as any;
        const sizes = new ImageSizes('/max.tif', 5000, imageProcessing);
        await sizes.init();

        expect(sizes.getSourceLevel({width: 5000, height: 2500}, {width: 5000, height: 2500}))
            .to.deep.include({page: 1, scaleX: 1, scaleY: 1});

        expect(sizes.getSourceLevel({width: 500, height: 500}, {width: 250, height: 250}))
            .to.deep.include({page: 2, scaleX: 0.5, scaleY: 0.5});
    });
});
