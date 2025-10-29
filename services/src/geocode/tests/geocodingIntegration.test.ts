import type { Polygon } from 'geojson';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { geocode } from '../geocoding';
import type { GeocodingResponseAPI } from '../types/apiTypes';

describe('Geocoding errors', () => {
    test('Geocoding test without API key', async () => {
        await expect(geocode({ query: '' })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(geocode({ query: '' })).rejects.toMatchObject({
            service: 'Geocode',
            status: 403,
        });
    });
});

describe('Geocoding integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    test('Geocoding with default params, expecting multiple results', async () => {
        const expectedResult = {
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: expect.any(Array),
                    },
                    properties: {
                        type: 'Street',
                        score: expect.any(Number),
                        matchConfidence: {
                            score: expect.any(Number),
                        },
                        address: expect.objectContaining({
                            streetName: 'Teakhout',
                            countryCode: 'NL',
                            countryCodeISO3: 'NLD',
                        }),
                    },
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: expect.any(Array),
                    },
                    properties: expect.any(Object),
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: expect.any(Array),
                    },
                    properties: expect.any(Object),
                },
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: expect.any(Array),
                    },
                    properties: expect.any(Object),
                },
            ],
        };

        const result = await geocode({ query: 'teakhout' });
        expect(result).toMatchObject(expectedResult);
    });

    test('Geocoding with all parameters sent', async () => {
        const result = await geocode({
            query: 'amsterdam',
            typeahead: true,
            limit: 15,
            offset: 3,
            position: [4.81063, 51.85925],
            countries: [],
            boundingBox: {
                type: 'Polygon',
                coordinates: [
                    [
                        [5.16905, 52.44009],
                        [5.16957, 52.44009],
                        [5.16957, 51.85925],
                        [5.16905, 51.85925],
                        [5.16905, 52.44009],
                    ],
                ],
            } as Polygon,
            extendedPostalCodesFor: ['Addr', 'Str', 'Geo'],
            mapcodes: ['International'],
            // TODO: not supported yet in Orbis:
            // view: "MA",
            geographyTypes: ['Municipality', 'MunicipalitySubdivision'],
            language: 'en-GB',
            radiusMeters: 1000000,
        });
        expect(result).toMatchObject({
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            features: expect.anything(),
        });
        expect(result.features.length).toBeGreaterThan(2);
    });

    test('Geocoding with template response override to get only the first raw result and summary', async () => {
        const customParserExample = {
            result: {
                type: 'Street',
                score: expect.any(Number),
                matchConfidence: {
                    score: expect.any(Number),
                },
                address: expect.objectContaining({
                    streetName: 'Teakhout',
                    municipality: expect.any(String),
                    countrySubdivision: expect.any(String),
                    countryCode: 'NL',
                    country: 'Nederland',
                    countryCodeISO3: 'NLD',
                    freeformAddress: expect.any(String),
                    localName: expect.any(String),
                }),
                position: {
                    lat: expect.any(Number),
                    lon: expect.any(Number),
                },
                viewport: {
                    topLeftPoint: {
                        lat: expect.any(Number),
                        lon: expect.any(Number),
                    },
                    btmRightPoint: {
                        lat: expect.any(Number),
                        lon: expect.any(Number),
                    },
                },
            },
            summary: {
                query: 'teakhout',
                queryType: 'NON_NEAR',
                numResults: expect.any(Number),
                offset: expect.any(Number),
                totalResults: expect.any(Number),
                fuzzyLevel: expect.any(Number),
            },
        };
        const result = await geocode(
            { query: 'teakhout' },
            {
                parseResponse: (response: GeocodingResponseAPI) =>
                    ({
                        result: response.results[0],
                        summary: response.summary,
                    }) as never,
            },
        );
        expect(result).toMatchObject(customParserExample);
    });

    test('Geocoding with API request and response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: GeocodingResponseAPI) => void;
        const result = await geocode({ query: 'Amsterdam', onAPIRequest: onApiRequest, onAPIResponse: onApiResponse });
        expect(result).toBeDefined();
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Geocoding with API request and response error callbacks', async () => {
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: GeocodingResponseAPI) => void;
        await expect(() =>
            geocode({
                query: 'Amsterdam',
                commonBaseURL: 'https://bljljljljl.com',
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow();
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });
});
