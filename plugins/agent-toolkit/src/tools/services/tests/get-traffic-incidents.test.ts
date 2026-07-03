import type { TrafficIncident } from '@tomtom-org/maps-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrafficAreaAnalyticsState, TrafficIncidentsState, TrafficTilesState } from '../../../state';
import { executeGetTrafficIncidents, getTrafficIncidentsSchema } from '../get-traffic-incidents';

vi.mock('@tomtom-org/maps-sdk/services', () => ({
    trafficIncidentDetails: vi.fn(),
    trafficAreaAnalytics: vi.fn().mockResolvedValue(null),
    geocode: vi.fn(),
    geocodeOne: vi.fn(),
    search: vi.fn(),
    searchOne: vi.fn(),
    geometryData: vi.fn(),
}));

import { geocode, trafficIncidentDetails } from '@tomtom-org/maps-sdk/services';

const mockFetch = trafficIncidentDetails as ReturnType<typeof vi.fn>;
const mockGeocode = geocode as ReturnType<typeof vi.fn>;

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
        baseMap: {
            mapLibreMap: {
                getBounds: () => ({
                    getWest: () => viewportBBox[0],
                    getSouth: () => viewportBBox[1],
                    getEast: () => viewportBBox[2],
                    getNorth: () => viewportBBox[3],
                }),
                getZoom: () => 12,
                getCenter: () => ({
                    lng: (viewportBBox[0] + viewportBBox[2]) / 2,
                    lat: (viewportBBox[1] + viewportBBox[3]) / 2,
                }),
            },
        },
        places: {
            findPlaceById: () => undefined,
            geometryPlaceIdsForEntry: () => undefined,
            fetchPlaceGeometry: async () => undefined,
        },
        routing: { entries: [] },
    } as any;
};

const withBBox = (bbox: [number, number, number, number]) => ({ mode: 'within', boundingBox: bbox }) as const;

// A shown fetch now arms a background monitor by default (its recurring tick uses setInterval).
// Fake only the interval timers so those polls never fire (and never leak) during unit tests, while
// leaving setTimeout / promises real so the awaited execute resolves normally.
beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
});
afterEach(() => {
    vi.useRealTimers();
});

describe('executeGetTrafficIncidents — loader contract', () => {
    // Rendering (showEntry) needs a real maplibre module, which the mock map lacks; it's covered by
    // its own tests, so stub it to a no-op here and focus on whether monitoring gets armed.
    const stubRender = (state: any) => {
        state.trafficIncidents.showEntry = async () => {};
    };

    it('arms monitoring by default on a shown fetch, without a duplicate fetch', async () => {
        // The loader now keeps the entry live (monitor defaults to true), but the monitor is armed
        // with skipInitialTick — its first tick is suppressed because the loader just fetched the
        // data — so the loader is still exactly ONE network call.
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam' })],
        });
        const state = makeState();
        stubRender(state);
        const result = (await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]) }, state)) as any;
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result.monitoring).toBe(true);
        expect(state.trafficIncidents.isMonitored(result.entryId)).toBe(true);
    });

    it('does not monitor a one-shot fetch (monitor: false) or a hidden fetch (show: false)', async () => {
        mockFetch.mockReset();
        mockFetch.mockResolvedValue({ type: 'FeatureCollection', features: [feat({ category: 'jam' })] });
        const oneShot = makeState();
        stubRender(oneShot);
        const r1 = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), monitor: false },
            oneShot,
        )) as any;
        expect(r1.monitoring).toBe(false);
        expect(oneShot.trafficIncidents.isMonitored(r1.entryId)).toBe(false);

        const hidden = makeState();
        const r2 = (await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]), show: false }, hidden)) as any;
        expect(r2.monitoring).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(2); // one per fetch, no monitor re-fetch
    });

    it('returns just count + entryId on bbox fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({ category: 'jam', magnitudeOfDelay: 'major', delayInSeconds: 300, roadNumbers: ['A4'] })],
        });
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), show: false },
            makeState(),
        )) as any;
        expect(result).toMatchObject({ count: 1, entryId: 'incidents-0' });
        // No summary / aggregations escape the loader — those belong to analyseData.
        expect(result.summary).toBeUndefined();
        expect(result.categoryCounts).toBeUndefined();
        expect(result.topRoads).toBeUndefined();
    });

    it('returns count: 0 with a referenceable empty entry when there are no features', async () => {
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const result = (await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]) }, makeState())) as any;
        expect(result).toMatchObject({ count: 0, entryId: 'incidents-0' });
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
            { where: withBBox([0, 0, 1, 1]), show: false },
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
            { where: withBBox([0, 0, 1, 1]), label: 'Amsterdam', show: false },
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
        await executeGetTrafficIncidents({ where: withBBox([4.75, 52.31, 4.99, 52.43]), show: false }, state);
        expect(state.trafficIncidents.entries[0].label).toContain('4.75');
        expect(state.trafficIncidents.entries[0].label).toContain('52.43');
    });

    it('returns entries summary listing all cached entries', async () => {
        mockFetch.mockResolvedValue({
            type: 'FeatureCollection',
            features: [feat({})],
        });
        const state = makeState();
        await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]), label: 'A', show: false }, state);
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([2, 2, 3, 3]), label: 'B', show: false },
            state,
        )) as any;
        expect(result.entries).toEqual([
            { id: 'incidents-0', label: 'A', count: 1, timestamp: expect.any(Number) },
            { id: 'incidents-1', label: 'B', count: 1, timestamp: expect.any(Number) },
        ]);
    });

    it('registers an empty (but referenceable) entry when bbox fetch returns zero features', async () => {
        // A zero-incident area is valid data, not a no-op: it still gets an entryId so downstream
        // analyseData / honest "no incidents found" can reference the empty set. It is not shown/fit
        // (nothing to draw), but it IS appended to state.
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const state = makeState();
        const result = (await executeGetTrafficIncidents(
            { where: withBBox([0, 0, 1, 1]), label: 'empty' },
            state,
        )) as any;
        expect(result).toMatchObject({ count: 0, entryId: 'incidents-0' });
        expect(state.trafficIncidents.entries).toHaveLength(1);
        expect(state.trafficIncidents.entries[0].data).toHaveLength(0);
    });

    it('does not start a monitor — polling is opt-in via setTrafficIncidentsMonitor', async () => {
        mockFetch.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [feat({})],
        });
        const state = makeState();
        const result = (await executeGetTrafficIncidents({ where: withBBox([0, 0, 1, 1]), show: false }, state)) as any;
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
        const result = (await executeGetTrafficIncidents({ show: false }, state)) as any;
        expect(result.entryId).toBe('incidents-0');
        expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ bbox: [4.75, 52.31, 4.99, 52.43] }));
        expect(state.trafficIncidents.entries[0].params.bbox).toEqual([4.75, 52.31, 4.99, 52.43]);
    });

    it('errors when the viewport fallback itself throws (no `where`, no map)', async () => {
        const state = makeState();
        state.baseMap = {
            mapLibreMap: {
                getBounds: () => {
                    throw new Error('map not ready');
                },
            },
        };
        const result = (await executeGetTrafficIncidents({ show: false }, state)) as any;
        // The adapter catches the throw and returns undefined; resolveAreas surfaces the curated message.
        expect(result.error).toContain('No map viewport available');
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

const street = (id: string) => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [-0.124, 51.499] },
    properties: {}, // no dataSources.geometry → not an area
});

describe('executeGetTrafficIncidents — where.queries resolution', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockGeocode.mockReset();
    });

    it('"Central London" (street-only geocode) returns a clear error, NOT count:0', async () => {
        mockGeocode.mockResolvedValueOnce({ type: 'FeatureCollection', features: [street('s1'), street('s2')] });
        const result = (await executeGetTrafficIncidents(
            { where: { mode: 'within', queries: [{ query: 'Central London', queryAs: 'place' }] }, show: false },
            makeState(),
        )) as any;
        expect(result.error).toContain('Central London');
        expect(result.count).toBeUndefined();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    const londonCA = {
        type: 'Feature',
        id: 'london-ca',
        geometry: { type: 'Point', coordinates: [-81.2, 43.0] },
        bbox: [-81.3, 42.9, -81.1, 43.1],
        properties: { address: { freeformAddress: 'London', countryCode: 'CA' } },
    };

    it('surfaces resolvedAreas with the grounded match, even on the zero-incident path', async () => {
        // "east London" from a London-UK view resolving to London, Ontario is the homonym the viewport
        // bias can't catch; resolvedAreas surfaces the grounded match — and must reach the zero-incident
        // path too (a mis-resolved area is exactly what returns nothing). (Per-resolution disclosure
        // behaviour is unit-tested in resolve-where.test; here we only check it reaches the output.)
        mockGeocode.mockResolvedValueOnce({ type: 'FeatureCollection', features: [londonCA] });
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const result = (await executeGetTrafficIncidents(
            { where: { mode: 'within', queries: [{ query: 'east London', queryAs: 'place' }] }, show: false },
            makeState(),
        )) as any;
        expect(result.count).toBe(0);
        expect(result.resolvedAreas).toEqual([{ query: 'east London', matched: 'London, CA' }]);
    });

    it('grounds the entry label to the matched place, not the query echo', async () => {
        mockGeocode.mockResolvedValueOnce({ type: 'FeatureCollection', features: [londonCA] });
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [feat({ category: 'jam' })] });
        const state = makeState();
        await executeGetTrafficIncidents(
            { where: { mode: 'within', queries: [{ query: 'east London', queryAs: 'place' }] }, show: false },
            state,
        );
        expect(state.trafficIncidents.entries[0].label).toBe('London, CA');
    });
});

// --- within refine: OR, not XOR ---

describe('getTrafficIncidentsSchema — within refine guards', () => {
    it('accepts viewport + queries together', () => {
        // OR, not XOR: the executor's resolveAreas prefers the explicit multi-region scope, so
        // co-specifying viewport must NOT be rejected at parse time.
        const r = getTrafficIncidentsSchema.safeParse({
            where: { mode: 'within', viewport: true, queries: [{ query: 'Paris' }] },
        });
        expect(r.success).toBe(true);
    });

    it('rejects an empty within', () => {
        const r = getTrafficIncidentsSchema.safeParse({
            where: { mode: 'within' },
        });
        expect(r.success).toBe(false);
    });
});

const rangeState = () => {
    const state = makeState();
    state.ranges = {
        entries: [
            {
                id: 'ranges-0',
                data: [
                    {
                        polygon: {
                            features: [
                                {
                                    type: 'Feature',
                                    bbox: [0, 0, 1, 1],
                                    geometry: {
                                        type: 'Polygon',
                                        coordinates: [
                                            [
                                                [0, 0],
                                                [1, 0],
                                                [1, 1],
                                                [0, 1],
                                                [0, 0],
                                            ],
                                        ],
                                    },
                                    properties: {},
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    };
    return state;
};

describe('executeGetTrafficIncidents — range composes with other within fields', () => {
    beforeEach(() => {
        mockFetch.mockReset();
        mockGeocode.mockReset();
    });

    it('unions the range area WITH a co-specified query (range no longer short-circuits)', async () => {
        // Range covers [0,0,1,1]; "Paris" geocodes to [2,2,3,3]; the fetched bbox must be the
        // union [0,0,3,3] — the schema says range "composes with" other multi-region fields.
        mockGeocode.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: 'paris',
                    geometry: { type: 'Point', coordinates: [2.5, 2.5] },
                    bbox: [2, 2, 3, 3],
                    properties: {},
                },
            ],
        });
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });

        await executeGetTrafficIncidents(
            {
                where: { mode: 'within', range: 'ranges-0', queries: [{ query: 'Paris', queryAs: 'place' }] },
                show: false,
            },
            rangeState(),
        );
        expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ bbox: [0, 0, 3, 3] }));
    });

    it('range-only within still resolves (no "No area specified")', async () => {
        mockFetch.mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        const result = (await executeGetTrafficIncidents(
            { where: { mode: 'within', range: 'ranges-0' }, show: false },
            rangeState(),
        )) as any;
        expect(result.error).toBeUndefined();
        expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ bbox: [0, 0, 1, 1] }));
    });
});
