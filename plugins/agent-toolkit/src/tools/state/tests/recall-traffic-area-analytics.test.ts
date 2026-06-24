import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import type { ToolState } from '../../../types';
import { executeRecallTrafficAreaAnalytics } from '../recall-traffic-area-analytics';

const data = {
    type: 'FeatureCollection',
    properties: {
        startDate: new Date('2026-06-08T00:00:00Z'),
        endDate: new Date('2026-06-14T00:00:00Z'),
        metrics: ['congestionLevel', 'speed'],
        heatmap: true,
        frcs: [0, 1],
        ranges: {},
    },
    features: [
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { name: 'Amsterdam' } },
        { type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { name: 'Utrecht' } },
    ],
} as unknown as TrafficAreaAnalytics;

const entry = { id: 'tta-0', label: 'Amsterdam analytics', timestamp: 123, data };

// Minimal analytics slice — the executor only reads these members.
const mockState = (): ToolState =>
    ({
        trafficAreaAnalytics: {
            entries: [entry],
            entryMode: 'multiple',
            shownEntryIds: new Set(['tta-0']),
            findById: (id: string) => (id === 'tta-0' ? entry : undefined),
        },
    }) as unknown as ToolState;

describe('executeRecallTrafficAreaAnalytics', () => {
    it('list view returns id/label/regionCount/metrics/shown', async () => {
        const result = await executeRecallTrafficAreaAnalytics({}, mockState());
        if (!('entries' in result)) throw new Error('expected a list result');
        expect(result.entries).toEqual([
            {
                id: 'tta-0',
                label: 'Amsterdam analytics',
                timestamp: 123,
                regionCount: 2,
                metrics: ['congestionLevel', 'speed'],
                shown: true,
            },
        ]);
    });

    it('detail view surfaces ISO date range, region names, and heatmap flag', async () => {
        const result = await executeRecallTrafficAreaAnalytics({ id: 'tta-0' }, mockState());
        if (!('dateRange' in result)) throw new Error('expected a detail result');
        expect(result.dateRange).toEqual({ start: '2026-06-08', end: '2026-06-14' });
        expect(result.regions).toEqual(['Amsterdam', 'Utrecht']);
        expect(result.heatmap).toBe(true);
    });

    it('errors with a recall hint for an unknown id', async () => {
        const result = await executeRecallTrafficAreaAnalytics({ id: 'missing' }, mockState());
        expect(result).toEqual({
            error: expect.stringMatching(
                /No traffic-area-analytics entry with id "missing".*recallState\(\{ kind: "trafficAreaAnalytics" \}\)/,
            ),
        });
    });
});
