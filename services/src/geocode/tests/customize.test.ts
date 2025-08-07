import { describe, expect, test } from 'vitest';
import { customizeService } from '../../../index';

describe('Using customize obj', () => {
    test('Geocoding request URL building tests using customize obj', () => {
        expect(
            customizeService.geocode
                .buildGeocodingRequest({
                    apiKey: 'API_KEY',
                    apiVersion: 2,
                    commonBaseURL: 'https://api.tomtom.com',
                    query: 'amsterdam',
                })
                .toString(),
        ).toStrictEqual('https://api.tomtom.com/maps/orbis/places/geocode/amsterdam.json?apiVersion=2&key=API_KEY');
    });
});
