import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Using customize obj', () => {
    test('revgeo request URL building tests using customize obj', () => {
        expect(
            customizeService.reverseGeocode
                .buildRevGeoRequest({
                    apiKey: 'API_KEY',
                    apiVersion: 2,
                    commonBaseURL: 'https://test.tomtom.com',
                    position: [1.12345, 23.45678],
                })
                .toString(),
        ).toStrictEqual(
            'https://test.tomtom.com/maps/orbis/places/reverseGeocode/23.45678,1.12345.json?apiVersion=2&key=API_KEY',
        );
    });
});
