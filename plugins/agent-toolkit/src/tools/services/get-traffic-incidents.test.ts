import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState, TrafficIncidentsState, TrafficTilesState } from '../../state';
import { executeGetTrafficIncidents } from './get-traffic-incidents';

vi.mock('@tomtom-org/maps-sdk/services', () => ({
    trafficIncidentDetails: vi.fn(),
    trafficAreaAnalytics: vi.fn().mockResolvedValue(null),
}));

import { trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

const mockFetch = trafficIncidentDetails as ReturnType<typeof vi.fn>;

const feat = (props: Partial<TrafficIncident['properties']> & { id?: string }): TrafficIncident => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: {
        ...props,
        id: props.id ?? `i-${Math.random()}`,
        category: props.category ?? 'other',
        magnitudeOfDelay: props.magnitudeOfDelay ?? 'unknown',
        timeValidity: props.timeValidity ?? 'present',
        events: props.events ?? [],
    } as TrafficIncident['properties'],
});

const makeState = (viewportBBox: [number, number, number, number] = [-1, 50, 1, 52]) => {
    const mlMap = {
        getSource: () => undefined,
        getLayer: () => undefined,
    };
    const trafficIncidents = new TrafficIncidentsState({ mapLibreMap: mlMap } as any);
    return {
        trafficTiles: new TrafficTilesState({} as any),
        trafficAreaAnalytics: new TrafficAreaAnalyticsState({} as any),
        trafficIncidents,
        baseMap: { ttMap: { getBBox: () => viewportBBox } },
    } as any;
};

const withBBox = (bbox: [number, number, number, number]) => ({ mode: 'within', boundingBox: bbox }) as const;

describe('executeGetTrafficIncidents — loader contract', () => {
    it('issues exactly one API call — no hidden duplicate fetch', async () => {
        // Regression: the loader used to also start a per-entry monitor whose eager first
        // tick re-fetched the same bbox. Polling now lives in startTrafficIncidentsMonitor,
        // so the loader is exactly one network call.
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam' })],
        });
        await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]), silent: true }, makeState());
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('returns just count + entryId on bbox fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam', magnitudeOfDelay: 'major', delayInSeconds: 300, roadNumbers: ['A4'] })],
        });
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), silent: true },
            makeState(),
        )) as any;
        expect(result).toMatchObject({ count: 1, entryId: 'incidents-0' });
        // No summary / aggregations escape the loader — those belong to analyseData.
        expect(result.summary).toBeUndefined();
        expect(result.categoryCounts).toBeUndefined();
        expect(result.topRoads).toBeUndefined();
    });

    it('returns count: 0 with no entry when there are no features', async () => {
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const result = (await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]) }, makeState())) as any;
        expect(result).toMatchObject({ count: 0 });
        expect(result.summary).toBeUndefined();
        // Loader-only contract: no per-incident array, no "top-N" shortcut, no includeIncidents
        // opt-in. Per-incident fields are reached only via analyseData / focusIncidents.
        expect(result.incidents).toBeUndefined();
        expect(result.topIncidents).toBeUndefined();
        expect(result.detailsWithheld).toBeUndefined();
    });

    it('does not return per-incident details or a top-N shortcut — forces the agent through analyseData', async () => {
        // This test guards the loader-only contract. Regressing to a `topIncidents` /
        // `incidents` shortcut lets the agent skip real spatial aggregation and pass off
        // individual top-delay incidents as "clusters".
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: Array.from({ length: 20 }, (_, i) =>
                feat({ id: `i-${i}`, category: 'jam', magnitudeOfDelay: 'major', delayInSeconds: i * 100 }),
            ),
        });
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), silent: true },
            makeState(),
        )) as any;
        expect(result.entryId).toBe('incidents-0');
        expect(result.count).toBe(20);
        expect(result.incidents).toBeUndefined();
        expect(result.topIncidents).toBeUndefined();
        expect(result.detailsWithheld).toBeUndefined();
    });
});

describe('executeGetTrafficIncidents — entries', () => {
    it('appends an entry on bbox fetch with features and returns entryId', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam' })],
        });
        const state = makeState();
        const result = await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), label: 'Amsterdam', silent: true },
            state,
        );
        expect(result).toMatchObject({
            entryId: 'incidents-0',
            entries: [{ id: 'incidents-0', label: 'Amsterdam', count: 1 }],
        });
        expect(state.trafficIncidents.entries).toHaveLength(1);
    });

    it('uses a deterministic auto-label when label is omitted', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({})],
        });
        const state = makeState();
        await executeGetTrafficIncidents({ where: withBBox([4.75, 52.31, 4.99, 52.43]), silent: true }, state);
        expect(state.trafficIncidents.entries[0].label).toContain('4.75');
        expect(state.trafficIncidents.entries[0].label).toContain('52.43');
    });

    it('returns entries summary listing all cached entries', async () => {
        mockFetch.mockResolvedValue({
            type: 'FeatureCollection',
            features: [feat({})],
        });
        const state = makeState();
        await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]), label: 'A', silent: true }, state);
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([2, 2, 3, 3]), label: 'B', silent: true },
            state,
        )) as any;
        expect(result.entries).toEqual([
            { id: 'incidents-0', label: 'A', count: 1, timestamp: expect.any(Number) },
            { id: 'incidents-1', label: 'B', count: 1, timestamp: expect.any(Number) },
        ]);
    });

    it('does not append when bbox fetch returns zero features', async () => {
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const state = makeState();
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), label: 'empty' },
            state,
        )) as any;
        expect(result.entryId).toBeUndefined();
        expect(state.trafficIncidents.entries).toHaveLength(0);
    });

    it('does not start a monitor — polling is opt-in via startTrafficIncidentsMonitor', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({})],
        });
        const state = makeState();
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), silent: true },
            state,
        )) as any;
        expect(state.trafficIncidents.isMonitored(result.entryId)).toBe(false);
    });
});

describe('executeGetTrafficIncidents — scope validation', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('falls back to the current map viewport when `where` is omitted', async () => {
        // The persona prompt promises "no `where` = current viewport". Without this fallback the
        // agent has to pre-call getViewport for every "this area / right now" question, which
        // doubles round-trips and breaks the contract the system prompt advertises.
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam' })],
        });
        const state = makeState([4.75, 52.31, 4.99, 52.43]);
        const result = (await executeGetTrafficIncidents({ silent: true }, state)) as any;
        expect(result.entryId).toBe('incidents-0');
        expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ bbox: [4.75, 52.31, 4.99, 52.43] }));
        expect(state.trafficIncidents.entries[0].params.bbox).toEqual([4.75, 52.31, 4.99, 52.43]);
    });

    it('errors when the viewport fallback itself throws (no `where`, no map)', async () => {
        const state = makeState();
        state.baseMap = {
            ttMap: {
                getBBox: () => {
                    throw new Error('map not ready');
                },
            },
        };
        const result = (await executeGetTrafficIncidents({ silent: true }, state)) as any;
        expect(result.error).toContain('Viewport fallback failed');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('surfaces upstream errors directly', async () => {
        mockFetch.mockRejectedValueOnce(new Error('bbox too large'));
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([-180, -90, 180, 90]) },
            makeState(),
        )) as any;
        expect(result.error).toContain('bbox too large');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
