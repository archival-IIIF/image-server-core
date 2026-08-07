import * as sinon from 'sinon';
import {expect} from 'chai';
import sharp from 'sharp';

import QualityRequest from '../src/QualityRequest.ts';
import {RequestError} from '../src/errors.ts';

describe('QualityRequest', () => {
    describe('#parseImageRequest()', () => {
        [
            'default',
            'color',
            'gray',
            'bitonal',
        ].forEach((request) => {
            it(`should not throw an error for ${request}`, () => {
                const qualityRequest = new QualityRequest(request);
                expect(() => {
                    qualityRequest.parseImageRequest();
                }).to.not.throw();
            });
        });

        [
            'deFaUlt',
            'COLOR',
            'black',
        ].forEach((request) => {
            it(`should throw a request error for ${request}`, () => {
                const qualityRequest = new QualityRequest(request);
                expect(() => {
                    qualityRequest.parseImageRequest();
                }).to.throw(RequestError);
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

        it('should execute the operation correctly for gray', () => {
            imageMock
                .expects('gamma')
                .once()
                .callThrough();

            imageMock
                .expects('grayscale')
                .once();

            const qualityRequest = new QualityRequest('gray');
            qualityRequest.parseImageRequest();
            qualityRequest.executeImageProcessing(image);

            imageMock.verify();
        });

        it('should execute the operation correctly for bitonal', () => {
            imageMock
                .expects('threshold')
                .once();

            const qualityRequest = new QualityRequest('bitonal');
            qualityRequest.parseImageRequest();
            qualityRequest.executeImageProcessing(image);

            imageMock.verify();
        });
    });
});
