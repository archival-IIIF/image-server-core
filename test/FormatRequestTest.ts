import * as sinon from 'sinon';
import {expect} from 'chai';
import sharp from 'sharp';

import FormatRequest from '../src/FormatRequest.ts';
import {NotImplementedError, RequestError} from '../src/errors.ts';

describe('FormatRequest', () => {
    describe('#parseImageRequest()', () => {
        [
            'jpg',
            'png',
            'webp',
            'tif',
        ].forEach((request) => {
            it(`should not throw an error for ${request}`, () => {
                const formatRequest = new FormatRequest(request);
                expect(() => {
                    formatRequest.parseImageRequest();
                }).to.not.throw();
            });
        });

        [
            'image',
            'JPG',
            'pNg',
        ].forEach((request) => {
            it(`should throw a request error for ${request}`, () => {
                const formatRequest = new FormatRequest(request);
                expect(() => {
                    formatRequest.parseImageRequest();
                }).to.throw(RequestError);
            });
        });

        [
            'gif',
            'jp2',
            'pdf',
        ].forEach((request) => {
            it(`should throw a not implemented error for ${request}`, () => {
                const formatRequest = new FormatRequest(request);
                expect(() => {
                    formatRequest.parseImageRequest();
                }).to.throw(NotImplementedError);
            });
        });
    });

    describe('#executeImageProcessing()', () => {
        const image = sharp();
        let imageMock: sinon.SinonMock;

        beforeEach(() => {
            imageMock = sinon.mock(image);
        });

        afterEach(() => {
            imageMock.restore();
        });

        ['jpg', 'png', 'webp', 'tif'].forEach(request => {
            it(`should execute the operation correctly for ${request}`, () => {
                imageMock
                    .expects('toFormat')
                    .once()
                    .withArgs(request);

                const formatRequest = new FormatRequest(request);
                formatRequest.parseImageRequest();
                formatRequest.executeImageProcessing(image);

                imageMock.verify();
            });
        });
    });
});
