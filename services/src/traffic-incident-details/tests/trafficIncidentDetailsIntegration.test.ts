import type { BBox, TrafficIncidentDetails } from '@tomtom-org/maps-sdk/core';
import { indexedMagnitudes, trafficIncidentCategories } from '@tomtom-org/maps-sdk/core';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import type { FetchInput } from '../../shared';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { trafficIncidentDetails } from '../trafficIncidentDetails';
import type { IncidentDetailsResponseAPI } from '../types/apiTypes';

// Amsterdam city centre — reliably has incidents during business hours
const AMSTERDAM_BBOX: BBox = [4.728, 52.278, 5.08, 52.479];

// Reusable shape matchers
const categoryRegex = new RegExp(trafficIncidentCategories.join('|'));
const magnitudeRegex = new RegExp(indexedMagnitudes.join('|'));

const expectedIncident = expect.objectContaining({
    type: 'Feature',
    geometry: expect.objectContaining({
        type: expect.stringMatching(/^Point|LineString$/),
        coordinates: expect.any(Array),
    }),
    properties: expect.objectContaining({
        id: expect.any(String),
        category: expect.stringMatching(categoryRegex),
        magnitudeOfDelay: expect.stringMatching(magnitudeRegex),
        events: expect.any(Array),
        timeValidity: expect.stringMatching(/^present|future$/),
    }),
});

describe('Traffic Incident Details errors', () => {
    test('rejects with SDKServiceError when no API key is set', async () => {
        expect(trafficIncidentDetails({ bbox: AMSTERDAM_BBOX })).rejects.toBeInstanceOf(SDKServiceError);
        expect(trafficIncidentDetails({ bbox: AMSTERDAM_BBOX })).rejects.toMatchObject({
            service: 'TrafficIncidentDetails',
            status: 403,
        });
    });
});

describe('Traffic Incident Details integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    // Shared bbox result — fetched once and reused by tests that need existing incident IDs
    let bboxResult: TrafficIncidentDetails;
    beforeAll(async () => {
        bboxResult = await trafficIncidentDetails({ bbox: AMSTERDAM_BBOX });
    });

    test('bbox query returns incidents with correct shape', () => {
        expect(bboxResult).toMatchObject({ type: 'FeatureCollection', features: expect.any(Array) });

        // The Amsterdam bbox reliably contains at least some incidents
        if (bboxResult.features.length > 0) {
            expect(bboxResult.features[0]).toMatchObject(expectedIncident);
        }
    });

    test('bbox query with present timeValidityFilter', async () => {
        const result = await trafficIncidentDetails({
            bbox: AMSTERDAM_BBOX,
            timeValidityFilter: ['present'],
        });

        expect(result.features).toBeInstanceOf(Array);
        for (const incident of result.features) {
            expect(incident.properties.timeValidity).toBe('present');
        }
    });

    test('bbox query with present and future timeValidityFilter', async () => {
        const result = await trafficIncidentDetails({
            bbox: AMSTERDAM_BBOX,
            timeValidityFilter: ['present', 'future'],
        });

        expect(result.features).toBeInstanceOf(Array);
        for (const incident of result.features) {
            expect(incident.properties.timeValidity).toMatch(/^present|future$/);
        }
    });

    test('bbox query with categoryFilter returns only matching categories', async () => {
        // Accidents (1) and road closures (8)
        const result = await trafficIncidentDetails({
            bbox: AMSTERDAM_BBOX,
            categoryFilter: [1, 8],
        });

        expect(result.features).toBeInstanceOf(Array);
        for (const incident of result.features) {
            expect(['accident', 'road-closed']).toContain(incident.properties.category);
        }
    });

    test('ids query (GET) looks up specific incidents found via bbox', async () => {
        // Skip the sub-test if no incidents are currently present
        if (bboxResult.features.length === 0) {
            return;
        }

        // Take up to 5 IDs to stay within GET limits
        const ids = bboxResult.features.slice(0, 5).map((i) => i.properties.id);

        const idResult = await trafficIncidentDetails({ ids });

        expect(idResult.features).toBeInstanceOf(Array);
        // At least some of the requested incidents should be returned
        expect(idResult.features.length).toBeGreaterThan(0);
        for (const incident of idResult.features) {
            expect(ids).toContain(incident.properties.id);
        }
    });

    test('ids query (POST) looks up multiple incidents', async () => {
        if (bboxResult.features.length === 0) {
            return;
        }

        // More than 5 IDs triggers POST automatically; cap at 100 (API limit)
        const ids = bboxResult.features.slice(0, 100).map((i) => i.properties.id);

        const postResult = await trafficIncidentDetails({ ids });

        expect(postResult.features).toBeInstanceOf(Array);
        expect(postResult.features.length).toBeGreaterThan(0);
        for (const incident of postResult.features) {
            expect(ids).toContain(incident.properties.id);
        }
    });

    test('custom template overrides the response parser', async () => {
        type CustomResult = { count: number };

        const result = await trafficIncidentDetails({ bbox: AMSTERDAM_BBOX }, {
            parseResponse: (response: IncidentDetailsResponseAPI): CustomResult => ({
                count: response.incidents.length,
            }),
        } as never);

        expect((result as unknown as CustomResult).count).toBeGreaterThanOrEqual(0);
    });

    test('onAPIRequest and onAPIResponse callbacks are called on success (bbox GET)', async () => {
        type Req = FetchInput<{ ids: string[] }>;
        type Res = IncidentDetailsResponseAPI;

        const onApiRequest = vi.fn() as (req: Req) => void;
        const onApiResponse = vi.fn() as (req: Req, res: Res) => void;

        const result = await trafficIncidentDetails({
            bbox: AMSTERDAM_BBOX,
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });

        expect(result).toBeDefined();
        const expectedRequest = { method: 'GET', url: expect.any(URL) };
        expect(onApiRequest).toHaveBeenCalledWith(expectedRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedRequest, expect.anything());
    });

    test('onAPIRequest and onAPIResponse callbacks are called on success (ids POST)', async () => {
        if (bboxResult.features.length === 0) {
            return;
        }

        type Req = FetchInput<{ ids: string[] }>;
        type Res = IncidentDetailsResponseAPI;

        // More than 5 IDs triggers POST automatically; cap at 100 (API limit)
        const ids = bboxResult.features.slice(0, 100).map((i) => i.properties.id);
        const onApiRequest = vi.fn() as (req: Req) => void;
        const onApiResponse = vi.fn() as (req: Req, res: Res) => void;

        await trafficIncidentDetails({
            ids,
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });

        const expectedRequest = expect.objectContaining({ method: 'POST', url: expect.any(URL) });
        expect(onApiRequest).toHaveBeenCalledWith(expectedRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedRequest, expect.anything());
    });

    test('onAPIRequest and onAPIResponse callbacks are called on error', async () => {
        type Req = FetchInput<{ ids: string[] }>;
        type Res = IncidentDetailsResponseAPI;

        const onApiRequest = vi.fn() as (req: Req) => void;
        const onApiResponse = vi.fn() as (req: Req, res: Res) => void;

        // Catch the rejection so we can assert on both the error and the callbacks
        const error = await trafficIncidentDetails({
            bbox: AMSTERDAM_BBOX,
            apiKey: 'invalid-key',
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        }).catch((e: unknown) => e);

        expect(error).toMatchObject({ status: 403 });
        const expectedRequest = { method: 'GET', url: expect.any(URL) };
        expect(onApiRequest).toHaveBeenCalledWith(expectedRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedRequest, expect.objectContaining({ status: 403 }));
    });
});
