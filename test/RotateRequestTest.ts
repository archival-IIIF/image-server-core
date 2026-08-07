import * as sinon from 'sinon';
import {expect} from 'chai';
import sharp from 'sharp';

import RotateRequest from '../src/RotateRequest.ts';
import {RequestError} from '../src/errors.ts';

describe('RotateRequest', () => {
    describe('#parseImageRequest()', () => {
        [
            '0',
            '!0',
            '180',
            '!45',
            '30.5',
            '!44.34',
        ].forEach((request) => {
            it(`should not throw an error for ${request}`, () => {
                const rotateRequest = new RotateRequest(request);
                expect(() => {
                    rotateRequest.parseImageRequest();
                }).to.not.throw();
            });
        });

        [
            '-20',
            '!-48',
            '378',
            '-378',
            'abc',
        ].forEach((request) => {
            it(`should throw a request error for ${request}`, () => {
                const rotateRequest = new RotateRequest(request);
                expect(() => {
                    rotateRequest.parseImageRequest();
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

        it('should not execute the rotate operation for 0', () => {
            imageMock
                .expects('rotate')
                .never();

            const rotateRequest = new RotateRequest('0');
            rotateRequest.parseImageRequest();
            rotateRequest.executeImageProcessing(image);

            imageMock.verify();
        });

        [
            {request: '180', rotate: 180},
            {request: '!45', rotate: 45},
            {request: '30.5', rotate: 31},
            {request: '!44.34', rotate: 44},
        ].forEach((testCase) => {
            it(`should execute the rotate operation correctly for ${testCase.request}`, () => {
                imageMock
                    .expects('rotate')
                    .once()
                    .withArgs(testCase.rotate);

                const rotateRequest = new RotateRequest(testCase.request);
                rotateRequest.parseImageRequest();
                rotateRequest.executeImageProcessing(image);

                imageMock.verify();
            });
        });

        [
            '0',
            '180',
            '30.5',
        ].forEach((request) => {
            it(`should not execute the flop operation for ${request}`, () => {
                imageMock
                    .expects('flop')
                    .never();

                const rotateRequest = new RotateRequest(request);
                rotateRequest.parseImageRequest();
                rotateRequest.executeImageProcessing(image);

                imageMock.verify();
            });
        });

        [
            '!0',
            '!45',
            '!44.34',
        ].forEach((request) => {
            it(`should execute the flop operation correctly for ${request}`, () => {
                imageMock
                    .expects('flop')
                    .once();

                const rotateRequest = new RotateRequest(request);
                rotateRequest.parseImageRequest();
                rotateRequest.executeImageProcessing(image);

                imageMock.verify();
            });
        });
    });
});
