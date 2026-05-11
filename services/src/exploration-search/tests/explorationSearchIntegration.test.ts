import type { Place, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { explorationSearch } from '../explorationSearch';
import { buildExplorationSearchRequest } from '../requestBuilder';
import { parseExplorationSearchResponse } from '../responseParser';
import type { ExplorationSearchParams, ExplorationSearchRequestAPI, ExplorationSearchResponseAPI } from '../types';

// The exploration-search service points at a hardcoded experimental Azure deployment;
// these tests hit it for real and assert on the live response shape.
// Every call must carry a geographic bias — the service requires one of
// position, boundingBox, or polygon, so tests that aren't exercising a
// specific filter reuse this Amsterdam-area bbox as a default.

const AMSTERDAM_BBOX: [number, number, number, number] = [4.78, 52.3, 5.0, 52.45];
const NL_WIDE_BBOX: [number, number, number, number] = [3.3, 50.75, 7.25, 53.55];

const expectSearchFeature: Place<SearchPlaceProps> = expect.objectContaining({
    type: 'Feature',
    id: expect.any(String),
    geometry: expect.objectContaining({
        type: 'Point',
        coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
    }),
    properties: expect.objectContaining<Partial<SearchPlaceProps>>({
        type: expect.any(String),
        address: expect.any(Object),
    }),
});

describe.skip('Exploration Search service', () => {
    beforeEach(async () => {
        // Spread requests out to avoid hammering the experimental deployment.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 500));
    });

    test('basic search returns a FeatureCollection of matching places', async () => {
        const response = await explorationSearch({ query: 'restaurant', boundingBox: AMSTERDAM_BBOX });

        expect(response).toEqual(
            expect.objectContaining({
                type: 'FeatureCollection',
                properties: expect.objectContaining({
                    query: 'restaurant',
                    queryType: 'NON_NEAR',
                    totalResults: expect.any(Number),
                    numResults: expect.any(Number),
                    offset: 0,
                }),
                features: expect.arrayContaining([expectSearchFeature]),
            }),
        );
        expect(response.features.length).toBeGreaterThan(0);

        // Key address fields must come back on at least some hits — the API
        // always returns them for Amsterdam restaurants, and regressions here
        // usually mean the response parser dropped a field mapping.
        const withStreetName = response.features.filter((feature) => !!feature.properties.address?.streetName);
        const withPostalCode = response.features.filter((feature) => !!feature.properties.address?.postalCode);
        const withMunicipality = response.features.filter((feature) => !!feature.properties.address?.municipality);
        const withCountryCode = response.features.filter((feature) => !!feature.properties.address?.countryCode);
        expect(withStreetName.length).toBeGreaterThan(0);
        expect(withPostalCode.length).toBeGreaterThan(0);
        expect(withMunicipality.length).toBeGreaterThan(0);
        expect(withCountryCode.length).toBeGreaterThan(0);
    });

    test('large page size returns the full requested number of features', async () => {
        const limit = 500;
        const response = await explorationSearch({ query: 'restaurant', boundingBox: NL_WIDE_BBOX, limit });

        expect(response.features).toHaveLength(limit);
    }, 30000);

    test('near + radiusMeters returns nearby places with distance + geoBias', async () => {
        const position: [number, number] = [4.9003, 52.3791];
        const response = await explorationSearch({
            position,
            radiusMeters: 5000,
            poiCategories: ['RESTAURANT'],
            limit: 5,
        });

        expect(response.features.length).toBeGreaterThan(0);
        expect(response.features.length).toBeLessThanOrEqual(5);
        expect(response.properties).toEqual(
            expect.objectContaining({
                queryType: 'NEARBY',
                geoBias: position,
                totalResults: expect.any(Number),
                numResults: response.features.length,
            }),
        );
        for (const feature of response.features) {
            expect(feature.properties.distance).toEqual(expect.any(Number));
            expect(feature.properties.poi?.categories).toEqual(
                expect.arrayContaining([expect.stringMatching(/RESTAURANT/)]),
            );
        }
    });

    test('bounding box filter constrains results to the requested window', async () => {
        const boundingBox: [number, number, number, number] = [4.85, 52.35, 4.95, 52.4];
        const response = await explorationSearch({
            query: 'cafe',
            boundingBox,
            limit: 10,
        });

        for (const feature of response.features) {
            const [lon, lat] = feature.geometry.coordinates;
            expect(lon).toBeGreaterThanOrEqual(boundingBox[0]);
            expect(lon).toBeLessThanOrEqual(boundingBox[2]);
            expect(lat).toBeGreaterThanOrEqual(boundingBox[1]);
            expect(lat).toBeLessThanOrEqual(boundingBox[3]);
        }
    });

    test('polygon filter constrains results to the polygon extent', async () => {
        const response = await explorationSearch({
            query: 'cafe',
            geometries: [
                {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [4.878, 52.364],
                            [4.922, 52.364],
                            [4.922, 52.394],
                            [4.878, 52.394],
                            [4.878, 52.364],
                        ],
                    ],
                },
            ],
            limit: 10,
        });

        for (const feature of response.features) {
            const [lon, lat] = feature.geometry.coordinates;
            expect(lon).toBeGreaterThanOrEqual(4.878);
            expect(lon).toBeLessThanOrEqual(4.922);
            expect(lat).toBeGreaterThanOrEqual(52.364);
            expect(lat).toBeLessThanOrEqual(52.394);
        }
    });

    test('circle geometry bridges to a polygon and constrains results', async () => {
        const center: [number, number] = [4.9003, 52.3791];
        const radius = 1500;
        const response = await explorationSearch({
            query: 'cafe',
            geometries: [{ type: 'Circle', coordinates: center, radius }],
            limit: 20,
        });

        expect(response.features.length).toBeGreaterThan(0);
        // Results must fall inside the circle's bounding square (with a generous
        // tolerance since the SDK approximates the circle as a 64-point polygon).
        const dLatDeg = (radius / 6371000) * (180 / Math.PI);
        const dLonDeg = dLatDeg / Math.cos((center[1] * Math.PI) / 180);
        for (const feature of response.features) {
            const [lon, lat] = feature.geometry.coordinates;
            expect(lon).toBeGreaterThanOrEqual(center[0] - dLonDeg * 1.05);
            expect(lon).toBeLessThanOrEqual(center[0] + dLonDeg * 1.05);
            expect(lat).toBeGreaterThanOrEqual(center[1] - dLatDeg * 1.05);
            expect(lat).toBeLessThanOrEqual(center[1] + dLatDeg * 1.05);
        }
    });

    test('placeTypes filter with "PointAddress" returns only address records', async () => {
        const response = await explorationSearch({
            boundingBox: AMSTERDAM_BBOX,
            placeTypes: ['PointAddress'],
            limit: 20,
        });

        expect(response.features.length).toBeGreaterThan(0);
        for (const feature of response.features) {
            expect(feature.properties.type).toBe('Point Address');
            // PointAddress hits have no POI document attached.
            expect(feature.properties.poi).toBeUndefined();
        }
    });

    test('placeTypes filter with "Street" returns only street records with viewport bbox', async () => {
        const response = await explorationSearch({
            boundingBox: AMSTERDAM_BBOX,
            placeTypes: ['Street'],
            limit: 10,
        });

        expect(response.features.length).toBeGreaterThan(0);
        for (const feature of response.features) {
            expect(feature.properties.type).toBe('Street');
            expect(feature.bbox).toEqual([
                expect.any(Number),
                expect.any(Number),
                expect.any(Number),
                expect.any(Number),
            ]);
        }
    });

    test('placeTypes filter with multiple values returns mixed records, each correctly discriminated', async () => {
        const response = await explorationSearch({
            boundingBox: AMSTERDAM_BBOX,
            placeTypes: ['POI', 'PointAddress'],
            limit: 30,
        });

        expect(response.features.length).toBeGreaterThan(0);
        const observedTypes = new Set(response.features.map((feature) => feature.properties.type));
        // Amsterdam's bbox virtually guarantees at least one of each type, but
        // we only assert that the response is confined to the requested set.
        for (const placeType of observedTypes) {
            expect(['POI', 'Point Address']).toContain(placeType);
        }
    });

    test('offset + limit paginate through the result set', async () => {
        const page1 = await explorationSearch({
            query: 'restaurant',
            boundingBox: AMSTERDAM_BBOX,
            offset: 0,
            limit: 5,
        });
        const page2 = await explorationSearch({
            query: 'restaurant',
            boundingBox: AMSTERDAM_BBOX,
            offset: 5,
            limit: 5,
        });

        expect(page1.features.length).toBeLessThanOrEqual(5);
        expect(page2.features.length).toBeLessThanOrEqual(5);
        expect(page1.properties?.offset).toBe(0);
        expect(page2.properties?.offset).toBe(5);
        const page1Ids = new Set(page1.features.map((feature) => feature.id));
        for (const feature of page2.features) {
            expect(page1Ids.has(feature.id)).toBe(false);
        }
    });

    test('country filter returns only places from the requested country', async () => {
        const response = await explorationSearch({
            query: 'cafe',
            countries: ['NL'],
            boundingBox: NL_WIDE_BBOX,
            limit: 10,
        });

        for (const feature of response.features) {
            const properties = feature.properties as SearchPlaceProps & { country_code?: string };
            const countryCode = properties.address?.countryCode ?? properties.country_code;
            expect(countryCode).toBe('NL');
        }
    });

    test('schema validation rejects out-of-range limit before any request is sent', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        await expect(
            explorationSearch({ query: 'restaurant', boundingBox: AMSTERDAM_BBOX, limit: 20000 }),
        ).rejects.toThrow();
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('schema validation rejects calls without a geo-bias', async () => {
        const fetchSpy = vi.spyOn(global, 'fetch');
        await expect(explorationSearch({ query: 'restaurant' })).rejects.toThrow(/geographic bias/i);
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    test('municipalities alone satisfies the geo-bias requirement', async () => {
        const response = await explorationSearch({
            query: 'cafe',
            municipalities: ['Amsterdam'],
            limit: 10,
        });

        expect(response.features.length).toBeGreaterThan(0);
        for (const feature of response.features) {
            expect(feature.properties.address?.municipality).toBe('Amsterdam');
        }
    });

    test('onAPIRequest and onAPIResponse callbacks fire with the built request', async () => {
        const onAPIRequest = vi.fn<(request: ExplorationSearchRequestAPI) => void>();
        const onAPIResponse = vi.fn<(request: ExplorationSearchRequestAPI, response: unknown) => void>();
        await explorationSearch({
            query: 'cafe',
            boundingBox: AMSTERDAM_BBOX,
            limit: 1,
            onAPIRequest,
            onAPIResponse,
        });

        expect(onAPIRequest).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL), data: expect.objectContaining({ q: 'cafe' }) }),
        );
        expect(onAPIResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL), data: expect.objectContaining({ q: 'cafe' }) }),
            expect.anything(),
        );
    });

    test('buildRequest hook can rewrite the body before it is sent', async () => {
        const response = await explorationSearch(
            { query: 'cafe', boundingBox: AMSTERDAM_BBOX, limit: 3 },
            {
                buildRequest: (params: ExplorationSearchParams) => {
                    const built = buildExplorationSearchRequest(params);
                    built.data = { ...built.data, q: 'restaurant' };
                    return built;
                },
            },
        );

        expect(response.properties?.query).toBe('cafe');
        expect(response.features.length).toBeGreaterThan(0);
    });

    test('parseResponse hook can override the final response', async () => {
        const response = await explorationSearch(
            { query: 'cafe', boundingBox: AMSTERDAM_BBOX, limit: 1 },
            {
                parseResponse: (apiResponse: ExplorationSearchResponseAPI, params: ExplorationSearchParams) => {
                    const parsed = parseExplorationSearchResponse(apiResponse, params);
                    parsed.bbox = [0, 0, 0, 0];
                    return parsed;
                },
            },
        );

        expect(response.bbox).toEqual([0, 0, 0, 0]);
    });
});
