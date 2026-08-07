import * as sinon from 'sinon';
import {expect} from 'chai';
import sharp from 'sharp';

import RegionRequest from '../src/RegionRequest.ts';
import {RequestError} from '../src/errors.ts';

describe('RegionRequest', () => {
    describe('#parseImageRequest()', () => {
        describe('having an image of 200 by 200', () => {
            const width = 200, height = 200;

            [
                {request: 'full', width: 200, height: 200},
                {request: 'square', width: 200, height: 200},
                {request: '0,0,200,200', width: 200, height: 200},
                {request: '20,20,170,170', width: 170, height: 170},
                {request: '20,20,190,190', width: 180, height: 180},
                {request: 'pct:0,0,100,100', width: 200, height: 200},
                {request: 'pct:40,40,50,50', width: 100, height: 100},
                {request: 'pct:40,40,70,70', width: 120, height: 120},
                {request: 'pct:22.1,45.6,10,20.44', width: 20, height: 41},
            ].forEach((request) => {
                it(`should not throw an error for ${request.request}`, () => {
                    const regionRequest = new RegionRequest(request.request);
                    regionRequest.setSize(({width: width, height: height}));
                    expect(() => {
                        regionRequest.parseImageRequest();
                    }).to.not.throw();
                });

                it(`should update the size of the ImageProcessingInfo object correctly for ${request.request}`, () => {
                    const regionRequest = new RegionRequest(request.request);
                    regionRequest.setSize(({width: width, height: height}));
                    regionRequest.parseImageRequest();

                    expect(regionRequest.getRegionSize().width).to.equal(request.width);
                    expect(regionRequest.getRegionSize().height).to.equal(request.height);
                });
            });

            [
                'FULL',
                'half',
                'SQUAre',
                '-4,0,200,200',
                '200,200,200,200',
                '6,100,0,0',
                '2,0',
                '9.3,0,80.2,100',
                '201,80,100,100',
                '80,201,100,100',
                'pct:-10,0,100,100',
                'pct:100,100',
                'pct:120,66,80,80',
                'pct:89,180,67,44',
            ].forEach((request) => {
                it(`should throw a request error for ${request}`, () => {
                    const regionRequest = new RegionRequest(request);
                    expect(() => {
                        regionRequest.parseImageRequest();
                    }).to.throw(RequestError);
                });
            });
        });

        describe('having a non-square image of 300 by 100', () => {
            const width = 300, height = 100;

            it(`should update the size of the ImageProcessingInfo object correctly for square`, () => {
                const regionRequest = new RegionRequest('square');
                regionRequest.setSize({width: width, height: height});
                regionRequest.parseImageRequest();

                expect(regionRequest.getRegionSize().width).to.equal(100);
                expect(regionRequest.getRegionSize().height).to.equal(100);
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

        describe('having an image of 200 by 200', () => {
            const width = 200, height = 200;

            [
                'full',
                'square',
                '0,0,200,200',
                'pct:0,0,100,100',
                '0,0,210,210',
                'pct:0,0,210,210'
            ].forEach((request) => {
                it(`should not execute the operation for ${request}`, () => {
                    imageMock
                        .expects('extract')
                        .never();

                    const regionRequest = new RegionRequest(request);
                    regionRequest.setSize(({width: width, height: height}));
                    regionRequest.parseImageRequest();
                    regionRequest.executeImageProcessing(image);

                    imageMock.verify();
                });
            });

            [
                {request: '20,30,100,120', left: 20, top: 30, width: 100, height: 120},
                {request: '20,30,220,340', left: 20, top: 30, width: 180, height: 170},
                {request: 'pct:10,20,40,50', left: 20, top: 40, width: 80, height: 100},
                {request: 'pct:5.5,8.8,12.2,95.3', left: 11, top: 18, width: 24, height: 182}
            ].forEach((testCase) => {
                it(`should execute the operation correctly for ${testCase.request}`, () => {
                    imageMock
                        .expects('extract')
                        .once()
                        .withArgs({
                            left: testCase.left,
                            top: testCase.top,
                            width: testCase.width,
                            height: testCase.height
                        });

                    const regionRequest = new RegionRequest(testCase.request);
                    regionRequest.setSize(({width: width, height: height}));
                    regionRequest.parseImageRequest();
                    regionRequest.executeImageProcessing(image);

                    imageMock.verify();
                });
            });
        });

        describe('having a non-square image of 300 by 100', () => {
            const width = 300, height = 100,
                expectedWidth = 100, expectedHeight = 100;

            it(`should execute the operation correctly for square`, () => {
                imageMock
                    .expects('resize')
                    .once()
                    .withArgs(expectedWidth, expectedHeight, {fit: 'cover', position: 'attention'});

                const regionRequest = new RegionRequest('square');
                regionRequest.setSize(({width: width, height: height}));
                regionRequest.parseImageRequest();
                regionRequest.executeImageProcessing(image);

                imageMock.verify();
            });
        });
    });
});
