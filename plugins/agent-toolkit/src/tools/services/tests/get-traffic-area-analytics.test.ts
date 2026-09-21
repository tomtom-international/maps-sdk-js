import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState } from '../../../state';
import { makeMockState } from '../../../tests/constants';
import { executeGetTrafficAreaAnalytics } from '../get-traffic-area-analytics';

// Minimal TrafficAreaAnalytics result — summarize() only reads features[0].properties
// (name/timezone/baseData/timedData/tiledData) and top-level properties.metrics.
const makeAnalyticsResult = (): TrafficAreaAnalytics =>
    ({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: {
                    name: 'Test Area',
                    timezone: 'UTC',
                    baseData: { speed: 50 },
                    timedData: {},
                    tiledData: { tiles: [] },
                },
            },
        ],
        properties: { metrics: ['speed'] },
    }) as unknown as TrafficAreaAnalytics;

describe('executeGetTrafficAreaAnalytics', () => {
    const analytics = new TrafficAreaAnalyticsState({} as TomTomMap);

    // The tool checks this env var before doing anything else — without it every call
    // short-circuits with the "MOVE_PORTAL_KEY environment variable is not set." error.
    beforeAll(() => {
        process.env.MOVE_PORTAL_KEY = 'test-key';
    });
    afterAll(() => {
        delete process.env.MOVE_PORTAL_KEY;
    });

    afterEach(() => {
        analytics.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // Neither location nor bbox → the area-missing error, returned before the API-key check.
    it('errors when neither location nor bbox is provided', async () => {
        const result = await executeGetTrafficAreaAnalytics(
            { metrics: 'all' },
            makeMockState({ trafficAreaAnalytics: analytics }),
        );

        expect(result).toEqual({ error: 'Provide a location or bbox to define the analytics area.' });
    });

    // bbox + key set → success, and a real entry is written to state.trafficAreaAnalytics.
    it('writes a real entry and summarizes the result for a bbox call', async () => {
        const spy = vi.spyOn(sdkServices, 'trafficAreaAnalytics').mockResolvedValue(makeAnalyticsResult());

        const result = await executeGetTrafficAreaAnalytics(
            { bbox: [4.8, 52.3, 5.0, 52.5], metrics: ['speed'] },
            makeMockState({ trafficAreaAnalytics: analytics }),
        );
        if ('error' in result) {
            expect.fail('expected executeGetTrafficAreaAnalytics to succeed');
        }

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'test-key', metrics: ['speed'] }));
        expect(result).toMatchObject({ name: 'Test Area', timezone: 'UTC', baseData: { speed: 50 } });
        expect(analytics.entries).toHaveLength(1);
        expect(analytics.entries[0].id).toBe(result.entryId);
    });

    // A location that resolves to a bare position (no boundary polygon) → the bare-position error.
    it('errors when the location resolves to a bare position', async () => {
        const result = await executeGetTrafficAreaAnalytics(
            { location: { position: [4.9, 52.4] }, metrics: 'all' },
            makeMockState({ trafficAreaAnalytics: analytics }),
        );

        expect(result).toEqual({
            error: 'A bare position cannot define an analytics area. Provide a named location query instead.',
        });
    });
});
