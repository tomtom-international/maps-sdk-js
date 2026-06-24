import { describe, expect, it } from 'vitest';
import type { ResolvedArea, WhereContext } from '../resolve-where';
import {
    biasDisclosure,
    isResolveError,
    resolveAreas,
    resolveBiasPoint,
    resolvedAreasDisclosure,
    toMultiFilters,
    unionBBox,
} from '../resolve-where';
import { areaWhereSchema } from '../schema';

describe('isResolveError', () => {
    it('discriminates the error shape', () => {
        expect(isResolveError({ error: 'x' })).toBe(true);
        expect(isResolveError([])).toBe(false);
    });
});

// Minimal fake place. `geometrySource` toggles whether a boundary polygon can be fetched.
const place = (id: string, opts: { bbox?: [number, number, number, number]; geometrySource?: boolean }) =>
    ({
        type: 'Feature',
        id,
        geometry: { type: 'Point', coordinates: [-0.12, 51.5] },
        ...(opts.bbox && { bbox: opts.bbox }),
        properties: { ...(opts.geometrySource && { dataSources: { geometry: { id: `g-${id}` } } }) },
    }) as any;

const polygonFeature = (bbox: [number, number, number, number]): any => ({
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

const baseCtx = (over: Partial<WhereContext> = {}): WhereContext => ({
    viewportBBox: () => undefined,
    viewportCenter: () => undefined,
    findPlaceById: () => undefined,
    fetchPlaceGeometry: async () => undefined,
    geocodeArea: async () => [],
    geocodeAreas: async () => [],
    fetchAreaPolygon: async () => undefined,
    getRoute: () => ({ error: 'no route (test fake default)' }),
    ...over,
});

// A geocoded area/place carrying an address — the grounded `matched` label derives from
// `freeformAddress, CC`. Point geometry sits at the bbox centre so view-nearest picks work.
const addrPlace = (
    id: string,
    bbox: [number, number, number, number],
    freeformAddress: string,
    countryCode: string,
): any => ({
    type: 'Feature',
    id,
    geometry: { type: 'Point', coordinates: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] },
    bbox,
    properties: { address: { freeformAddress, countryCode } },
});

describe('resolveAreas — query→area (strict)', () => {
    it('area geocode returns no area (all results lack a bbox) → ResolveError, NOT a zero-area bbox', async () => {
        // Regression for the original bug: nothing resolves to an area.
        const ctx = baseCtx({ geocodeAreas: async () => [place('s1', {}), place('s2', {})] });
        const r = await resolveAreas({ queries: [{ query: 'Central London', queryAs: 'place' }] }, ctx);
        expect(r).toMatchObject({ error: expect.stringContaining('Central London') });
    });

    it('area with a geometry source → fetches polygon, uses its bbox', async () => {
        const ctx = baseCtx({
            geocodeAreas: async () => [place('w', { bbox: [-0.2, 51.4, -0.1, 51.6], geometrySource: true })],
            fetchAreaPolygon: async () => polygonFeature([-0.2, 51.4, -0.1, 51.6]),
        });
        const r = await resolveAreas({ queries: [{ query: 'Westminster', queryAs: 'place' }] }, ctx);
        // No address on the fake → no grounded label (matched is never the query echo); `query` still
        // carries the input. The area resolves and the polygon is fetched regardless.
        expect(r).toEqual([
            expect.objectContaining({ source: 'query', query: 'Westminster', bbox: [-0.2, 51.4, -0.1, 51.6] }),
        ]);
        expect((r as any)[0].label).toBeUndefined();
        expect((r as any)[0].polygon.type).toBe('Polygon');
    });

    it('area without a geometry source → accepts its own bbox', async () => {
        const ctx = baseCtx({ geocodeAreas: async () => [place('g', { bbox: [-0.2, 51.4, -0.1, 51.6] })] });
        const r = await resolveAreas({ queries: [{ query: 'London', queryAs: 'place' }] }, ctx);
        expect(r).toEqual([expect.objectContaining({ source: 'query', bbox: [-0.2, 51.4, -0.1, 51.6] })]);
    });

    it('empty geocode → ResolveError', async () => {
        const r = await resolveAreas({ queries: [{ query: 'zzz', queryAs: 'place' }] }, baseCtx());
        expect(r).toMatchObject({ error: expect.stringContaining('zzz') });
    });
});

describe('resolveAreas — grounded resolution (homonym signal)', () => {
    const LONDON_UK = [-0.12, 51.5]; // viewport centre

    it('one match → resolvedAreasDisclosure surfaces the grounded match', async () => {
        const ctx = baseCtx({
            viewportCenter: () => LONDON_UK,
            geocodeAreas: async () => [addrPlace('uk', [-0.2, 51.4, -0.1, 51.6], 'London', 'GB')],
        });
        const r = await resolveAreas({ queries: [{ query: 'London', queryAs: 'place' }] }, ctx);
        expect((r as any)[0]).toMatchObject({ source: 'query', label: 'London, GB', query: 'London' });
        expect(resolvedAreasDisclosure(r as any)).toEqual([{ query: 'London', matched: 'London, GB' }]);
    });

    it('multiple same-name matches → picks the view-nearest as the grounded match', async () => {
        // "east London" from a London-UK view: the geocoder returns London, Ontario AND London, GB.
        // nearestArea picks GB — the disclosed `matched` is the view-nearest, not the geocoder's top.
        const ctx = baseCtx({
            viewportCenter: () => LONDON_UK,
            geocodeAreas: async () => [
                addrPlace('on', [-81.3, 42.9, -81.1, 43.1], 'London', 'CA'), // ~5,800 km — far
                addrPlace('uk', [-0.2, 51.4, -0.1, 51.6], 'London', 'GB'), // nearest → picked
            ],
        });
        const r = await resolveAreas({ queries: [{ query: 'east London', queryAs: 'place' }] }, ctx);
        expect((r as any)[0]).toMatchObject({ source: 'query', label: 'London, GB', query: 'east London' });
        expect(resolvedAreasDisclosure(r as any)).toEqual([{ query: 'east London', matched: 'London, GB' }]);
    });

    it('candidates without an address → NOT disclosed (matched is never the query echo)', async () => {
        // The grounded label needs `freeformAddress` (real area geocodes carry it); without it there
        // is no truthful match, so the area is omitted rather than echoing the query as `matched`.
        const ctx = baseCtx({
            viewportCenter: () => LONDON_UK,
            geocodeAreas: async () => [
                place('a', { bbox: [-0.2, 51.4, -0.1, 51.6] }),
                place('b', { bbox: [-81.3, 42.9, -81.1, 43.1] }),
            ],
        });
        const r = await resolveAreas({ queries: [{ query: 'Foo', queryAs: 'place' }] }, ctx);
        // The area still resolves (bbox used for the search) but carries no grounded label.
        expect((r as any)[0].label).toBeUndefined();
        expect(resolvedAreasDisclosure(r as any)).toEqual([]);
    });

    it('raw boundingBox area is not disclosed (nothing was geocoded)', async () => {
        const r = await resolveAreas({ boundingBox: [0, 0, 1, 1] }, baseCtx());
        expect(resolvedAreasDisclosure(r as any)).toEqual([]);
    });
});

describe('resolveAreas — other branches', () => {
    it('boundingBox → passthrough area', async () => {
        const r = await resolveAreas({ boundingBox: [0, 0, 1, 1] }, baseCtx());
        expect(r).toEqual([{ bbox: [0, 0, 1, 1], source: 'boundingBox' }]);
    });

    it('viewport → viewport bbox', async () => {
        const r = await resolveAreas({ viewport: true }, baseCtx({ viewportBBox: () => [2, 2, 3, 3] }));
        expect(r).toEqual([{ bbox: [2, 2, 3, 3], source: 'viewport' }]);
    });

    it('geometries → one area per polygon with derived bbox', async () => {
        const poly = polygonFeature([0, 0, 2, 2]).geometry;
        const r = await resolveAreas({ geometries: [poly] }, baseCtx());
        expect(r).toEqual([expect.objectContaining({ source: 'geometries', bbox: [0, 0, 2, 2], polygon: poly })]);
    });

    it('placeId with geometry source → fetched polygon area', async () => {
        const ctx = baseCtx({
            findPlaceById: (id) => place(id, { geometrySource: true }),
            fetchPlaceGeometry: async () => polygonFeature([-0.2, 51.4, -0.1, 51.6]),
        });
        const r = await resolveAreas({ placeIds: ['p1'] }, ctx);
        expect(r).toEqual([expect.objectContaining({ source: 'placeId', bbox: [-0.2, 51.4, -0.1, 51.6] })]);
    });

    it('placeId WITHOUT geometry source → strict error (ignores any cached bbox)', async () => {
        const ctx = baseCtx({ findPlaceById: (id) => place(id, { bbox: [0, 0, 1, 1] }) });
        const r = await resolveAreas({ placeIds: ['p1'] }, ctx);
        expect(r).toMatchObject({ error: expect.stringContaining('geometry data source') });
    });

    it('unknown placeId → error', async () => {
        const r = await resolveAreas({ placeIds: ['nope'] }, baseCtx());
        expect(r).toMatchObject({ error: expect.stringContaining('Unknown placeId') });
    });

    it('route → one buffered corridor area per route feature', async () => {
        const line: any = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [0, 0],
                    [0.1, 0.1],
                ],
            },
            properties: {},
        };
        const ctx = baseCtx({ getRoute: () => ({ features: [line], label: 'A4 corridor' }) });
        const r = await resolveAreas({ route: { widthMeters: 200 } }, ctx);
        expect(Array.isArray(r)).toBe(true);
        expect((r as ResolvedArea[])[0]).toMatchObject({ source: 'route', label: 'A4 corridor' });
        expect((r as ResolvedArea[])[0].polygon).toBeDefined();
    });

    it('no scope at all → error', async () => {
        const r = await resolveAreas({}, baseCtx());
        expect(r).toMatchObject({ error: expect.stringContaining('No area') });
    });

    it('degenerate geometries + viewport → falls back to the viewport (does not suppress it)', async () => {
        // Regression: a non-empty `geometries` whose every polygon is degenerate (no derivable bbox)
        // used to count as multi-region intent and return an empty array, ignoring `viewport: true`.
        const degenerate: any = { type: 'Polygon', coordinates: [] };
        const r = await resolveAreas(
            { viewport: true, geometries: [degenerate] },
            baseCtx({ viewportBBox: () => [2, 2, 3, 3] }),
        );
        expect(r).toEqual([{ bbox: [2, 2, 3, 3], source: 'viewport' }]);
    });

    it('degenerate geometries WITHOUT viewport → empty area set (preserves prior behavior)', async () => {
        const degenerate: any = { type: 'Polygon', coordinates: [] };
        const r = await resolveAreas({ geometries: [degenerate] }, baseCtx());
        expect(r).toEqual([]);
    });
});

describe('projections', () => {
    const areas: ResolvedArea[] = [
        { bbox: [0, 0, 1, 1], source: 'boundingBox' },
        { bbox: [2, 2, 4, 4], polygon: { type: 'Polygon', coordinates: [] } as any, source: 'query' },
    ];
    it('unionBBox covers all bboxes', () => {
        expect(
            unionBBox([
                [0, 0, 1, 1],
                [2, 2, 4, 4],
            ]),
        ).toEqual([0, 0, 4, 4]);
    });
    it('toMultiFilters splits polygons from bbox-only areas', () => {
        const mf = toMultiFilters(areas);
        expect(mf.geometries).toHaveLength(1);
        expect(mf.boundingBoxes).toEqual([[0, 0, 1, 1]]);
    });
});

describe('areaWhereSchema is the AreaWhere source of truth', () => {
    it('validates the resolver input shape (no `range` field — caller-side)', () => {
        expect(areaWhereSchema.safeParse({ viewport: true }).success).toBe(true);
        expect(areaWhereSchema.safeParse({ queries: [{ query: 'Paris' }] }).success).toBe(true);
        expect('range' in areaWhereSchema.shape).toBe(false);
    });
});

describe('resolveBiasPoint (tolerant)', () => {
    it('position → passthrough (no homonym fields — a literal point is exactly what was asked)', async () => {
        expect(await resolveBiasPoint({ position: [4.9, 52.4] }, baseCtx())).toEqual({ position: [4.9, 52.4] });
    });
    it('viewport → viewport centre (no homonym fields)', async () => {
        expect(await resolveBiasPoint({ viewport: true }, baseCtx({ viewportCenter: () => [5, 52] }))).toEqual({
            position: [5, 52],
        });
    });
    it('query without an address → position + query echo, no grounded label', async () => {
        const ctx = baseCtx({ geocodeArea: async () => [place('p', {})] }); // point at [-0.12, 51.5], no address
        expect(await resolveBiasPoint({ query: { query: 'Schiphol', queryAs: 'poi' } }, ctx)).toEqual({
            position: [-0.12, 51.5],
            query: 'Schiphol',
        });
    });
    it('query with one match → grounded label; biasDisclosure surfaces it (awareness, any distance)', async () => {
        const schiphol = addrPlace('s', [4.7, 52.3, 4.82, 52.32], 'Schiphol', 'NL');
        const ctx = baseCtx({ viewportCenter: () => [4.9, 52.35], geocodeArea: async () => [schiphol] });
        const r = await resolveBiasPoint({ query: { query: 'Schiphol', queryAs: 'poi' } }, ctx);
        expect(r.label).toBe('Schiphol, NL');
        expect(r.query).toBe('Schiphol');
        expect(biasDisclosure(r)).toEqual([{ query: 'Schiphol', matched: 'Schiphol, NL' }]);
    });
    it('unresolvable query → empty resolution (NOT an error)', async () => {
        expect(await resolveBiasPoint({ query: { query: 'zzz' } }, baseCtx())).toEqual({});
    });
    it('empty where → empty resolution', async () => {
        expect(await resolveBiasPoint({}, baseCtx())).toEqual({});
    });
});

describe('resolveAreas — robustness', () => {
    it('skips a degenerate (empty-coordinates) polygon instead of crashing on an undefined bbox', async () => {
        // bboxFromGeoJSON returns undefined for empty coords; the branch must skip it (no push of an
        // undefined bbox, no throw) → an empty areas array that callers handle.
        const r = await resolveAreas({ geometries: [{ type: 'Polygon', coordinates: [] } as never] }, baseCtx());
        expect(r).toEqual([]);
    });

    it('keeps only the valid polygon when a degenerate one is mixed in', async () => {
        const valid = polygonFeature([0, 0, 2, 2]).geometry;
        const r = await resolveAreas({ geometries: [valid, { type: 'Polygon', coordinates: [] } as never] }, baseCtx());
        expect(Array.isArray(r)).toBe(true);
        expect((r as ResolvedArea[]).length).toBe(1);
        expect((r as ResolvedArea[])[0].bbox).toEqual([0, 0, 2, 2]);
    });

    it('passes through a zero-size boundingBox when supplied', async () => {
        const r = await resolveAreas({ boundingBox: [0, 0, 0, 0] }, baseCtx());
        expect(r).toEqual([{ bbox: [0, 0, 0, 0], source: 'boundingBox' }]);
    });
});

describe('resolveAreas — bboxOnlyQueries (traffic path)', () => {
    it('uses the top candidate bbox and does NOT fetch a boundary polygon, even with a geometry source', async () => {
        let fetched = false;
        const ctx = baseCtx({
            // Top area HAS a geometry source — the default (discover) path would fetch its polygon;
            // bboxOnly (traffic) must skip the fetch and take the area's own bbox directly.
            geocodeAreas: async () => [place('top', { bbox: [-0.2, 51.4, -0.1, 51.6], geometrySource: true })],
            fetchAreaPolygon: async () => {
                fetched = true;
                return polygonFeature([0, 0, 1, 1]);
            },
        });
        const r = await resolveAreas({ queries: [{ query: 'London' }] }, ctx, { bboxOnlyQueries: true });
        expect(r).toEqual([expect.objectContaining({ source: 'query', bbox: [-0.2, 51.4, -0.1, 51.6] })]);
        expect(fetched).toBe(false);
        expect((r as ResolvedArea[])[0].polygon).toBeUndefined();
    });

    it('still errors when nothing resolves to an area, rather than searching a zero-area box', async () => {
        const ctx = baseCtx({ geocodeAreas: async () => [place('s1', {})] });
        const r = await resolveAreas({ queries: [{ query: 'Central London' }] }, ctx, { bboxOnlyQueries: true });
        expect(r).toMatchObject({ error: expect.stringContaining('to an area') });
    });
});

describe('resolveAreas — nearest-to-view disambiguation', () => {
    it('picks the same-name area nearest the viewport (e.g. Westminster→London, not Maryland)', async () => {
        const ctx = baseCtx({
            viewportCenter: () => [-0.12, 51.51], // London
            geocodeAreas: async () => [
                place('md', { bbox: [-77, 39.5, -76.9, 39.6] }), // Westminster, Maryland (top-ranked)
                place('ldn', { bbox: [-0.18, 51.49, -0.12, 51.51] }), // Westminster, London (nearer)
            ],
        });
        const r = await resolveAreas({ queries: [{ query: 'Westminster' }] }, ctx, { bboxOnlyQueries: true });
        expect(r).toEqual([expect.objectContaining({ source: 'query', bbox: [-0.18, 51.49, -0.12, 51.51] })]);
    });
});
