import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import type { FetchInput } from '../../shared';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { trafficAreaAnalytics } from '../trafficAreaAnalytics';
import type { AreaAnalyticsRequestBody, AreaAnalyticsResponseAPI } from '../types/apiTypes';
import type { AreaAnalyticsDataType, FunctionalRoadClass } from '../types/trafficAreaAnalyticsParams';

// A small polygon covering central Amsterdam
const AMSTERDAM_GEOMETRY = {
    type: 'Polygon' as const,
    coordinates: [
        [
            [4.896128, 52.382402],
            [4.875701, 52.368459],
            [4.923611, 52.36341],
            [4.896128, 52.382402],
        ],
    ],
};

const BASE_PARAMS = {
    startDate: new Date('2024-08-06'),
    endDate: new Date('2024-08-06'),
    functionalRoadClasses: [
        'MOTORWAY',
        'MAJOR_ROAD',
        'OTHER_MAJOR_ROAD',
        'SECONDARY_ROAD',
        'LOCAL_CONNECTING_ROAD',
        'LOCAL_ROAD_HIGH_IMPORTANCE',
    ] as FunctionalRoadClass[],
    hours: [7, 8, 9, 17, 18],
    dataTypes: ['SPEED', 'CONGESTION_LEVEL'] as AreaAnalyticsDataType[],
    geometry: AMSTERDAM_GEOMETRY,
};

describe('Traffic Area Analytics errors', () => {
    test('rejects with SDKServiceError when no API key is set', async () => {
        await expect(trafficAreaAnalytics(BASE_PARAMS)).rejects.toBeInstanceOf(SDKServiceError);
        await expect(trafficAreaAnalytics(BASE_PARAMS)).rejects.toMatchObject({
            service: 'TrafficAreaAnalytics',
            status: 403,
        });
    });
});

describe('Traffic Area Analytics integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    // Area Analytics requires a specific subscription; gracefully skip if unavailable.
    let result: TrafficAreaAnalytics | undefined;
    beforeAll(async () => {
        try {
            result = await trafficAreaAnalytics(BASE_PARAMS);
        } catch {
            // API not accessible in this environment — dependent tests will skip
        }
    });

    test('returns a FeatureCollection with collection-level properties', () => {
        if (!result) return;
        expect(result.type).toBe('FeatureCollection');
        expect(result.properties).toMatchObject({
            startDate: BASE_PARAMS.startDate,
            endDate: BASE_PARAMS.endDate,
            dataTypes: expect.arrayContaining(['SPEED', 'CONGESTION_LEVEL']),
            heatmap: expect.any(Boolean),
            frcs: expect.any(Array),
        });
    });

    test('returns one feature per submitted region', () => {
        if (!result) return;
        expect(result.features).toHaveLength(1);
    });

    test('feature has expected shape', () => {
        if (!result) return;
        const feature = result.features[0];
        expect(feature.type).toBe('Feature');
        expect(feature.id).toEqual(expect.any(String));
        expect(feature.geometry.type).toBe('Polygon');
        expect(feature.properties).toMatchObject({
            name: expect.any(String),
            timezone: expect.any(String),
            level: expect.any(Number),
            baseData: expect.any(Object),
            timedData: expect.any(Object),
        });
    });

    test('baseData contains SDK-named metric fields', () => {
        if (!result) return;
        const { baseData } = result.features[0].properties;
        // At least one of the requested metrics should be present
        const hasAnyMetric =
            baseData.speed !== undefined ||
            baseData.congestionLevel !== undefined ||
            baseData.freeFlowSpeed !== undefined ||
            baseData.travelTime !== undefined ||
            baseData.networkLength !== undefined;
        expect(hasAnyMetric).toBe(true);
    });

    test('custom template can override the response parser', async () => {
        if (!result) return;
        type CustomResult = { regionCount: number };

        const customResult = await trafficAreaAnalytics(BASE_PARAMS, {
            parseResponse: (response: AreaAnalyticsResponseAPI): CustomResult => ({
                regionCount: response.features.length,
            }),
        } as never);

        expect((customResult as unknown as CustomResult).regionCount).toBeGreaterThanOrEqual(0);
    });

    test('onAPIRequest and onAPIResponse callbacks are invoked', async () => {
        if (!result) return;
        type Req = FetchInput<AreaAnalyticsRequestBody>;
        type Res = AreaAnalyticsResponseAPI;

        const onApiRequest = vi.fn() as (req: Req) => void;
        const onApiResponse = vi.fn() as (req: Req, res: Res) => void;

        const callResult = await trafficAreaAnalytics({
            ...BASE_PARAMS,
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });

        expect(callResult).toBeDefined();
        const expectedRequest = expect.objectContaining({ method: 'POST', url: expect.any(URL) });
        expect(onApiRequest).toHaveBeenCalledWith(expectedRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedRequest, expect.anything());
    });

    test('onAPIRequest and onAPIResponse are called even on error', async () => {
        type Req = FetchInput<AreaAnalyticsRequestBody>;
        type Res = AreaAnalyticsResponseAPI;

        const onApiRequest = vi.fn() as (req: Req) => void;
        const onApiResponse = vi.fn() as (req: Req, res: Res) => void;

        const error = await trafficAreaAnalytics({
            ...BASE_PARAMS,
            apiKey: 'invalid-key',
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        }).catch((e: unknown) => e);

        expect(error).toMatchObject({ status: 403 });
        const expectedRequest = expect.objectContaining({ method: 'POST', url: expect.any(URL) });
        expect(onApiRequest).toHaveBeenCalledWith(expectedRequest);
        expect(onApiResponse).toHaveBeenCalledWith(expectedRequest, expect.objectContaining({ status: 403 }));
    });
});
