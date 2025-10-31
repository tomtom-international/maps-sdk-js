import type { Places } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { geometryData } from '../geometryData';
import type { GeometryDataResponseAPI } from '../types/apiTypes';
import places from './geometryDataIntegration.data.json';

describe('Geometry data errors', () => {
    test('Geometry data test without API key', async () => {
        await expect(geometryData({ geometries: ['GEOMETRY_ID'] })).rejects.toMatchObject({
            service: 'GeometryData',
            status: 403,
        });
    });

    test('Geometry data test without geometries supplied', async () => {
        await expect(
            geometryData({ apiKey: 'KEY', commonBaseURL: 'https://api.tomtom.com', geometries: [] }),
        ).rejects.toMatchObject({
            service: 'GeometryData',
            issues: [
                {
                    origin: 'array',
                    code: 'too_small',
                    minimum: 1,
                    inclusive: true,
                    path: ['geometries'],
                    message: 'Invalid input',
                },
            ],
        });
    });
});

describe('Geometry data integration tests', () => {
    beforeAll(() => {
        TomTomConfig.instance.put({ apiKey: process.env.API_KEY_TESTS });
    });

    beforeEach(async () => {
        // We enforce a delay before each test to avoid hitting the API rate limits.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
    });

    test('Geometry data of some place', async () => {
        const result = await geometryData({ geometries: ['10794339'] });
        expect(result).toMatchObject({
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            features: [
                {
                    type: 'Feature',
                    id: '10794339',
                    properties: {},
                    bbox: expect.any(Array),
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: expect.arrayContaining([]),
                    },
                },
            ],
        });
    });

    test('Geometry data of a country with MultiPolygon', async () => {
        const result = await geometryData({ geometries: ['10792745'], zoom: 5 });
        expect(result).toMatchObject({
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            features: [
                {
                    type: 'Feature',
                    id: '10792745',
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: expect.arrayContaining([]),
                    },
                },
            ],
        });
    });

    test('Geometry data of the communities of Catalonia, Madrid, and Canary Islands', async () => {
        const cataloniaGeometryId = '21505330';
        const madridGeometryId = '18999766';
        const canaryIslandsGeometryId = '12672113';

        const result = await geometryData({
            geometries: [cataloniaGeometryId, madridGeometryId, canaryIslandsGeometryId],
            zoom: 10,
        });
        expect(result).toMatchObject({
            type: 'FeatureCollection',
            bbox: expect.any(Array),
            features: [
                {
                    type: 'Feature',
                    id: cataloniaGeometryId,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: expect.arrayContaining([]),
                    },
                },
                {
                    type: 'Feature',
                    id: madridGeometryId,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: expect.arrayContaining([]),
                    },
                },
                {
                    type: 'Feature',
                    id: canaryIslandsGeometryId,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: expect.arrayContaining([]),
                    },
                },
            ],
        });
    });

    test(
        'Geometry data of the communities of Catalonia, Madrid, and Canary Islands ' +
            "where Madrid UUID is incorrect and won't be found",
        async () => {
            const cataloniaGeometryId = '21505330';
            const madridGeometryId = 'INCORRECT';
            const canaryIslandsGeometryId = '12672113';

            const result = await geometryData({
                geometries: [cataloniaGeometryId, madridGeometryId, canaryIslandsGeometryId],
                zoom: 4,
            });
            expect(result).toMatchObject({
                type: 'FeatureCollection',
                bbox: expect.any(Array),
                features: [
                    {
                        type: 'Feature',
                        id: cataloniaGeometryId,
                        bbox: expect.any(Array),
                        properties: {},
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: expect.arrayContaining([]),
                        },
                    },
                    {
                        type: 'Feature',
                        id: canaryIslandsGeometryId,
                        bbox: expect.any(Array),
                        properties: {},
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: expect.arrayContaining([]),
                        },
                    },
                ],
            });
        },
    );

    test('Geometry Data with API response callback', async () => {
        const geometries = ['10794339'];
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: GeometryDataResponseAPI) => void;
        const result = await geometryData({
            geometries,
            zoom: 10,
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });
        expect(result).toBeDefined();
        expect(result.features.length).toBeGreaterThan(0);
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Geometry Data with API error response callback', async () => {
        const geometries = ['10794339'];
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: GeometryDataResponseAPI) => void;
        await expect(() =>
            geometryData({
                geometries,
                zoom: -1,
                validateRequest: false,
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toMatchObject({ status: 400 });
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});

describe('Geometry with Places', () => {
    test('Build a geometry response with places properties - integration', async () => {
        const result = await geometryData({ geometries: places as unknown as Places });
        const azoresGeometryId = '20313022';
        const azoresRegion = result?.features.find((feature) => feature.id === azoresGeometryId);

        expect(azoresRegion?.properties).toMatchObject({
            ...places.features[0].properties,
            placeCoordinates: places.features[0].geometry.coordinates,
        });
    });
});
