import { afterEach, describe, expect, it, test, vi } from 'vitest';
import { buildDiscoverPlacesSchema, buildDiscoverPlacesWhereSchema, executeDiscoverPlaces } from '../discover-places';

// --- services mock (hoisted by Vitest) ---
// All exports that discover-places + locate-place + tool-state-where-context import must appear
// here. Missing exports cause a "No X export is defined" runtime error.
vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>();
    return {
        // Keep real constants (POPULATED_AREA_TAGS etc.) so Zod z.enum works.
        ...actual,
        // Replace function exports with controllable spies.
        explorationSearch: vi.fn(),
        search: vi.fn(),
        searchOne: vi.fn(),
        geocode: vi.fn(),
        geocodeOne: vi.fn(),
        geometryData: vi.fn(),
        alongRouteSearch: vi.fn(),
    };
});

import { geocode, geometryData, search } from '@tomtom-org/maps-sdk/services';

const mockGeocode = geocode as ReturnType<typeof vi.fn>;
const mockGeometryData = geometryData as ReturnType<typeof vi.fn>;
const mockSearch = search as ReturnType<typeof vi.fn>;

// --- helpers ---

const placeWithGeometry = (id: string, bbox: [number, number, number, number]) => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [bbox[0] + (bbox[2] - bbox[0]) / 2, bbox[1] + (bbox[3] - bbox[1]) / 2] },
    bbox,
    properties: {
        address: {},
        dataSources: { geometry: { id: `g-${id}` } },
    },
});

const streetOnlyPlace = (id: string) => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [4.9, 52.4] },
    // no bbox, no dataSources.geometry → street/address/POI, not a resolvable area
    properties: { address: {} },
});

const polygonFeature = (bbox: [number, number, number, number]) => ({
    type: 'Feature',
    bbox,
    geometry: {
        type: 'Polygon',
        coordinates: [
            [
                [bbox[0], bbox[1]],
                [bbox[2], bbox[1]],
                [bbox[2], bbox[3]],
                [bbox[0], bbox[3]],
                [bbox[0], bbox[1]],
            ],
        ],
    },
    properties: {},
});

const emptyFeatureCollection = { type: 'FeatureCollection', features: [] };

const makeState = () =>
    ({
        baseMap: {
            mapLibreMap: {
                getBounds: () => ({
                    getWest: () => 4.7,
                    getSouth: () => 52.2,
                    getEast: () => 5.1,
                    getNorth: () => 52.5,
                }),
                getZoom: () => 12,
                getCenter: () => ({ lng: 4.9, lat: 52.35 }),
            },
        },
        places: {
            findPlaceById: () => undefined,
            fetchPlaceGeometry: async () => undefined,
            addPlaceResult: async (_result: unknown, _label: string) => 'places-0',
            entries: [],
        },
        routing: { entries: [] },
        ranges: { entries: [] },
    }) as any;

// --- schema tests (existing) ---

// Parse a complete-enough payload and inspect the result. Zod's default object behaviour is to
// strip unknown keys, so a successfully-parsed `areaTags` / `areaId` value on the output is the
// signature that the schema knows the field.

describe('discoverPlaces — areaId / areaTags are gated on experimentalSearch', () => {
    test('default flag set: areaTags is stripped from the top-level payload', () => {
        const schema = buildDiscoverPlacesSchema({});
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true },
            areaTags: ['walkable'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as { areaTags?: string[] }).areaTags).toBeUndefined();
        }
    });

    test('experimentalSearch: true — areaTags survives parsing at the top level', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true },
            areaTags: ['walkable', 'transit_connected'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect((result.data as { areaTags?: string[] }).areaTags).toEqual(['walkable', 'transit_connected']);
        }
    });

    test('experimentalSearch: true — areaId alone satisfies the within-mode geo-bias refinement', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', areaId: '20567430' },
        });
        expect(result.success).toBe(true);
        if (result.success && result.data.where?.mode === 'within') {
            expect((result.data.where as { areaId?: string }).areaId).toBe('20567430');
        }
    });

    test('experimentalSearch: true — areaId + viewport together is rejected (mutually exclusive)', () => {
        const schema = buildDiscoverPlacesSchema({ experimentalSearch: true });
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', viewport: true, areaId: '20567430' },
        });
        expect(result.success).toBe(false);
    });

    test('default flag set — within with areaId only fails the geo-bias refinement', () => {
        // Without experimentalSearch, areaId is stripped by Zod's default object behaviour (unknown
        // keys are dropped), and the remaining within payload has no geo-bias, so the refinement rejects.
        const schema = buildDiscoverPlacesSchema({});
        const result = schema.safeParse({
            query: 'cafe',
            where: { mode: 'within', areaId: '20567430' },
        });
        expect(result.success).toBe(false);
    });
});

// --- behavior tests for resolveDiscoverWithin rewire (Task 7) ---

describe('executeDiscoverPlaces — within queries resolution via resolveAreas', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    test('query with a geometry source: polygon fetched from geometryData reaches search multiFilters.geometries', async () => {
        // geocode (via locatePlaces in toolStateToWhereContext.geocodeArea) returns one place with a
        // geometry data source; geometryData returns its boundary polygon.
        const bbox: [number, number, number, number] = [4.8, 52.3, 4.95, 52.45];
        mockGeocode.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [placeWithGeometry('amsterdam', bbox)],
        });
        mockGeometryData.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [polygonFeature(bbox)],
        });
        mockSearch.mockResolvedValueOnce(emptyFeatureCollection);

        const result = await executeDiscoverPlaces(
            { query: 'cafe', where: { mode: 'within', queries: [{ query: 'Amsterdam', queryAs: 'place' }] } },
            makeState(),
        );

        // No error
        expect((result as { error?: string }).error).toBeUndefined();

        // The polygon (from geometryData) must reach search's `geometries` multiFilter.
        expect(mockSearch).toHaveBeenCalledOnce();
        const searchCall = mockSearch.mock.calls[0][0] as { geometries?: unknown[] };
        expect(searchCall.geometries).toHaveLength(1);
        expect((searchCall.geometries?.[0] as { type: string }).type).toBe('Polygon');
    });

    test('street-only geocode (no geometry source, no bbox) → returns resolveAreas error, does NOT call search', async () => {
        // After the rewire, resolveAreas returns ResolveError with the canonical message
        // "did not resolve to an area" instead of the old discover-local message
        // "resolved to a place with no geometry or bbox — cannot use as a 'within' area."
        mockGeocode.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [streetOnlyPlace('s1'), streetOnlyPlace('s2')],
        });

        const result = (await executeDiscoverPlaces(
            { query: 'cafe', where: { mode: 'within', queries: [{ query: 'Damrak', queryAs: 'place' }] } },
            makeState(),
        )) as { error?: string };

        expect(result.error).toBeDefined();
        expect(result.error).toMatch(/Damrak/);
        // The shared resolveAreas error message (not the old discover-local wording).
        expect(result.error).toMatch(/to an area/);
        expect(mockSearch).not.toHaveBeenCalled();
    });
});

describe('executeDiscoverPlaces — resolvedAreas (grounded resolution on within queries)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    // A bbox-only place (no geometry data source) resolves straight to its bbox, so no geometryData
    // fetch is needed — the simplest path to exercise the disclosure.
    const bboxOnlyPlace = (
        id: string,
        bbox: [number, number, number, number],
        freeformAddress: string,
        countryCode: string,
    ) => ({
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] },
        bbox,
        properties: { address: { freeformAddress, countryCode } },
    });

    test('a within query surfaces resolvedAreas with the grounded match (mirrors getTrafficIncidents)', async () => {
        // "Paris" from the default Amsterdam view resolving to Paris, Texas is the homonym the viewport
        // bias cannot catch; resolvedAreas surfaces the grounded match so the agent can confirm/correct.
        // (Per-resolution disclosure behaviour is unit-tested in resolve-where.test; here only the wiring.)
        mockGeocode.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [bboxOnlyPlace('paris-tx', [-95.6, 33.6, -95.5, 33.7], 'Paris', 'US')],
        });
        mockSearch.mockResolvedValueOnce(emptyFeatureCollection);

        const result = (await executeDiscoverPlaces(
            { query: 'cafe', where: { mode: 'within', queries: [{ query: 'Paris', queryAs: 'place' }] } },
            makeState(),
        )) as any;

        expect(result.error).toBeUndefined();
        expect(result.resolvedAreas).toEqual([{ query: 'Paris', matched: 'Paris, US' }]);
        // The search still ran — the disclosure is a cue, not a block.
        expect(mockSearch).toHaveBeenCalledOnce();
    });
});

describe('discoverPlaces — within refine guards', () => {
    it('rejects viewport combined with route', () => {
        const schema = buildDiscoverPlacesWhereSchema({ experimentalSearch: false });
        expect(schema.safeParse({ mode: 'within', viewport: true, route: { widthMeters: 200 } }).success).toBe(false);
    });
});

// --- Task 13: discover nearby delegates to resolveBiasPoint ---

describe('executeDiscoverPlaces — nearby query bias via resolveBiasPoint', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('nearby + query → bias position from the geocoded result', async () => {
        // First search call: locatePlaces (bias lookup); second: the actual coffee search.
        mockSearch
            .mockResolvedValueOnce({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 's',
                        geometry: { type: 'Point', coordinates: [4.76, 52.31] },
                        properties: {},
                    },
                ],
            })
            .mockResolvedValueOnce({ type: 'FeatureCollection', features: [] });
        await executeDiscoverPlaces(
            { query: 'coffee', where: { mode: 'nearby', query: 'Schiphol Airport', queryAs: 'poi' } },
            makeState(),
        );
        // The second search call (coffee) must be biased to [4.76, 52.31].
        expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ position: [4.76, 52.31] }));
    });
});

describe('executeDiscoverPlaces — resolvedAreas (grounded resolution on nearby query bias)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    // A geocoded bias point — `nearby` resolves it to a Position (geometry coords) and reads its
    // grounded label from the address; no bbox needed (the bias is a point, not an area).
    const biasPlace = (id: string, coords: [number, number], freeformAddress: string, countryCode: string) => ({
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: coords },
        properties: { address: { freeformAddress, countryCode } },
    });

    test('a nearby query surfaces resolvedAreas with the grounded match', async () => {
        // "Sydney" from the default Amsterdam view biasing to Sydney Mines, Nova Scotia silently skews
        // the cafe results — resolvedAreas surfaces the grounded match. `queryAs: 'place'` resolves the
        // bias via `geocode`; the search itself via `search`. (Disclosure logic: resolve-where.test.)
        mockGeocode.mockResolvedValueOnce({
            type: 'FeatureCollection',
            features: [biasPlace('bias', [-60.2, 46.14], 'Sydney Mines', 'CA')],
        });
        mockSearch.mockResolvedValueOnce(emptyFeatureCollection);

        const result = (await executeDiscoverPlaces(
            { query: 'cafe', where: { mode: 'nearby', query: 'Sydney', queryAs: 'place' } },
            makeState(),
        )) as any;

        expect(result.error).toBeUndefined();
        expect(result.resolvedAreas).toEqual([{ query: 'Sydney', matched: 'Sydney Mines, CA' }]);
        expect(mockSearch).toHaveBeenCalledOnce();
    });

    test('an explicit nearby position carries no homonym risk (no resolvedAreas)', async () => {
        // A literal coordinate is exactly what the operator asked for — nothing to disclose.
        mockSearch.mockResolvedValueOnce(emptyFeatureCollection);

        const result = (await executeDiscoverPlaces(
            { query: 'coffee', where: { mode: 'nearby', position: [-60.2, 46.14] } },
            makeState(),
        )) as any;

        expect(result.error).toBeUndefined();
        expect(result.resolvedAreas).toBeUndefined();
    });
});

describe('executeDiscoverPlaces — range-only within resolves (regression: no "No area specified")', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('a range-only within searches (does not error before range is consumed)', async () => {
        // Regression: resolveDiscoverWithin used to call resolveAreas unconditionally and return its
        // "No area specified" error before the range path ran. Now it skips resolveAreas when no
        // query/placeId/geometry/route field is present.
        const state = makeState();
        state.ranges = {
            entries: [{ id: 'ranges-0', ranges: [{ polygon: { features: [polygonFeature([0, 0, 1, 1])] } }] }],
        };
        mockSearch.mockResolvedValueOnce(emptyFeatureCollection);

        const result = (await executeDiscoverPlaces(
            { query: 'cafe', where: { mode: 'within', range: 'ranges-0' } },
            state,
        )) as { error?: string };

        expect(result.error).toBeUndefined();
        expect(mockSearch).toHaveBeenCalledOnce();
    });
});
