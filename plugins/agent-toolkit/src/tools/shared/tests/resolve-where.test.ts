import { bboxFromBBoxes } from '@tomtom-org/maps-sdk/core';
import { describe, expect, it } from 'vitest';
import type { ResolvedArea, WhereContext } from '../resolve-where';
import { isResolveError, resolveNearby, resolveWithin } from '../resolve-where';
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
    viewport: () => ({}),
    expandEntry: () => undefined,
    geocodeAreas: async () => [],
    fetchGeometry: async () => undefined,
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

describe('resolveWithin — query→area (strict)', () => {
    it('area geocode returns no area (all results lack a bbox) → ResolveError, NOT a zero-area bbox', async () => {
        // Regression for the original bug: nothing resolves to an area.
        const ctx = baseCtx({ geocodeAreas: async () => [place('s1', {}), place('s2', {})] });
        const r = await resolveWithin({ queries: [{ query: 'Central London', queryAs: 'place' }] }, ctx);
        expect(r).toMatchObject({ error: expect.stringContaining('Central London') });
    });

    it('area with a geometry source → fetches polygon, uses its bbox', async () => {
        const ctx = baseCtx({
            geocodeAreas: async () => [place('w', { bbox: [-0.2, 51.4, -0.1, 51.6], geometrySource: true })],
            fetchGeometry: async () => polygonFeature([-0.2, 51.4, -0.1, 51.6]),
        });
        const r = await resolveWithin({ queries: [{ query: 'Westminster', queryAs: 'place' }] }, ctx);
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
        const r = await resolveWithin({ queries: [{ query: 'London', queryAs: 'place' }] }, ctx);
        expect(r).toEqual([expect.objectContaining({ source: 'query', bbox: [-0.2, 51.4, -0.1, 51.6] })]);
    });

    it('empty geocode → ResolveError', async () => {
        const r = await resolveWithin({ queries: [{ query: 'zzz', queryAs: 'place' }] }, baseCtx());
        expect(r).toMatchObject({ error: expect.stringContaining('zzz') });
    });
});

describe('resolveWithin — grounded resolution (homonym signal)', () => {
    const LONDON_UK: [number, number] = [-0.12, 51.5]; // viewport centre

    it('one match → carries the grounded label', async () => {
        const ctx = baseCtx({
            viewport: () => ({ center: LONDON_UK }),
            geocodeAreas: async () => [addrPlace('uk', [-0.2, 51.4, -0.1, 51.6], 'London', 'GB')],
        });
        const r = await resolveWithin({ queries: [{ query: 'London', queryAs: 'place' }] }, ctx);
        expect((r as any)[0]).toMatchObject({ source: 'query', label: 'London, GB', query: 'London' });
    });

    it('multiple same-name matches → picks the view-nearest as the grounded match', async () => {
        // "east London" from a London-Ontario view: the geocoder returns London, Ontario AND London, GB.
        // The view-nearest is picked — the disclosed `matched` is CA here, not the geocoder's top.
        const LONDON_CA: [number, number] = [-81.2, 43]; // viewport centre — near London, Ontario
        const ctx = baseCtx({
            viewport: () => ({ center: LONDON_CA }),
            geocodeAreas: async () => [
                addrPlace('on', [-81.3, 42.9, -81.1, 43.1], 'London', 'CA'), // nearest → picked
                addrPlace('uk', [-0.2, 51.4, -0.1, 51.6], 'London', 'GB'), // ~5,800 km — far
            ],
        });
        const r = await resolveWithin({ queries: [{ query: 'east London', queryAs: 'place' }] }, ctx);
        expect((r as any)[0]).toMatchObject({ source: 'query', label: 'London, CA', query: 'east London' });
    });

    it('candidates without an address → no grounded label (never echoes the query as if it matched)', async () => {
        // The grounded label needs `freeformAddress` (real area geocodes carry it); without it there
        // is no truthful match, so the area resolves with no label rather than echoing the query.
        const ctx = baseCtx({
            viewport: () => ({ center: LONDON_UK }),
            geocodeAreas: async () => [
                place('a', { bbox: [-0.2, 51.4, -0.1, 51.6] }),
                place('b', { bbox: [-81.3, 42.9, -81.1, 43.1] }),
            ],
        });
        const r = await resolveWithin({ queries: [{ query: 'Foo', queryAs: 'place' }] }, ctx);
        // The area still resolves (bbox used for the search) but carries no grounded label.
        expect((r as any)[0].label).toBeUndefined();
    });

    it('raw boundingBox area carries no label (nothing was geocoded)', async () => {
        const r = await resolveWithin({ boundingBox: [0, 0, 1, 1] }, baseCtx());
        expect((r as ResolvedArea[])[0].label).toBeUndefined();
    });
});

describe('resolveWithin — other branches', () => {
    it('boundingBox → passthrough area', async () => {
        const r = await resolveWithin({ boundingBox: [0, 0, 1, 1] }, baseCtx());
        expect(r).toEqual([{ bbox: [0, 0, 1, 1], source: 'boundingBox' }]);
    });

    it('viewport → viewport bbox', async () => {
        const r = await resolveWithin({ viewport: true }, baseCtx({ viewport: () => ({ bbox: [2, 2, 3, 3] }) }));
        expect(r).toEqual([{ bbox: [2, 2, 3, 3], source: 'viewport' }]);
    });

    it('geometries → one area per polygon with derived bbox', async () => {
        const poly = polygonFeature([0, 0, 2, 2]).geometry;
        const r = await resolveWithin({ geometries: [poly] }, baseCtx());
        expect(r).toEqual([expect.objectContaining({ source: 'geometries', bbox: [0, 0, 2, 2], polygon: poly })]);
    });

    it('placeId with geometry source → fetched polygon area', async () => {
        const ctx = baseCtx({ fetchGeometry: async () => polygonFeature([-0.2, 51.4, -0.1, 51.6]) });
        const r = await resolveWithin({ placeIds: ['p1'] }, ctx);
        expect(r).toEqual([expect.objectContaining({ source: 'placeId', bbox: [-0.2, 51.4, -0.1, 51.6] })]);
    });

    it('placeId WITHOUT a fetchable geometry → error (id unknown, no geometry source, or fetch failed)', async () => {
        // fetchGeometry folds all three of the old distinct cases into one `undefined` outcome, so
        // the message here is necessarily generic rather than naming which of the three happened.
        const ctx = baseCtx({ fetchGeometry: async () => undefined });
        const r = await resolveWithin({ placeIds: ['p1'] }, ctx);
        expect(r).toMatchObject({ error: expect.stringContaining('p1') });
    });

    it('unknown placeId → error', async () => {
        const r = await resolveWithin({ placeIds: ['nope'] }, baseCtx());
        expect(r).toMatchObject({ error: expect.stringContaining('nope') });
    });

    it('ENTRY id → expands to its geometry-bearing places (one area each)', async () => {
        // The id passed in `placeIds` is an entry id; the entry holds two geometry-bearing places.
        const ctx = baseCtx({
            expandEntry: (id) => (id === 'london-area' ? ['p1', 'p2'] : undefined),
            fetchGeometry: async (placeOrId) =>
                placeOrId === 'p1' ? polygonFeature([-0.2, 51.4, -0.1, 51.6]) : polygonFeature([0, 0, 1, 1]),
        });
        const r = await resolveWithin({ placeIds: ['london-area'] }, ctx);
        expect(r).toEqual([
            expect.objectContaining({ source: 'placeId', bbox: [-0.2, 51.4, -0.1, 51.6] }),
            expect.objectContaining({ source: 'placeId', bbox: [0, 0, 1, 1] }),
        ]);
    });

    it('ENTRY id with no geometry-bearing place → actionable error', async () => {
        const ctx = baseCtx({ expandEntry: (id) => (id === 'addr-entry' ? [] : undefined) });
        const r = await resolveWithin({ placeIds: ['addr-entry'] }, ctx);
        expect(r).toMatchObject({ error: expect.stringContaining('no place with a geometry data source') });
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
        const r = await resolveWithin({ route: { widthMeters: 200 } }, ctx);
        expect(Array.isArray(r)).toBe(true);
        expect((r as ResolvedArea[])[0]).toMatchObject({ source: 'route', label: 'A4 corridor' });
        expect((r as ResolvedArea[])[0].polygon).toBeDefined();
    });

    it('no scope at all → empty area set, not an error (a caller composing with its own scope decides)', async () => {
        const r = await resolveWithin({}, baseCtx());
        expect(r).toEqual([]);
    });

    it('degenerate geometries + viewport → falls back to the viewport (does not suppress it)', async () => {
        // Regression: a non-empty `geometries` whose every polygon is degenerate (no derivable bbox)
        // used to count as multi-region intent and return an empty array, ignoring `viewport: true`.
        const degenerate: any = { type: 'Polygon', coordinates: [] };
        const r = await resolveWithin(
            { viewport: true, geometries: [degenerate] },
            baseCtx({ viewport: () => ({ bbox: [2, 2, 3, 3] }) }),
        );
        expect(r).toEqual([{ bbox: [2, 2, 3, 3], source: 'viewport' }]);
    });

    it('degenerate geometries WITHOUT viewport → empty area set (preserves prior behavior)', async () => {
        const degenerate: any = { type: 'Polygon', coordinates: [] };
        const r = await resolveWithin({ geometries: [degenerate] }, baseCtx());
        expect(r).toEqual([]);
    });
});

describe('projections', () => {
    it('bboxFromBBoxes covers all bboxes', () => {
        expect(
            bboxFromBBoxes([
                [0, 0, 1, 1],
                [2, 2, 4, 4],
            ]),
        ).toEqual([0, 0, 4, 4]);
    });
});

describe('areaWhereSchema is the AreaWhere source of truth', () => {
    it('validates the resolver input shape (no `range` field — caller-side)', () => {
        expect(areaWhereSchema.safeParse({ viewport: true }).success).toBe(true);
        expect(areaWhereSchema.safeParse({ queries: [{ query: 'Paris' }] }).success).toBe(true);
        expect('range' in areaWhereSchema.shape).toBe(false);
    });
});

describe('resolveNearby (tolerant)', () => {
    // NOTE: `nearby`'s live `where` shape is `AreaWhere` (viewport / queries), same as `within` —
    // there is currently no `position` field on it at all, so the old "position → passthrough" case
    // has no equivalent input to test. This is a real gap (nearby is supposed to support an explicit
    // point, not just viewport/query), not a rename — flagging rather than fabricating a pass.

    it('viewport → viewport centre (no homonym fields)', async () => {
        expect(await resolveNearby({ viewport: true }, baseCtx({ viewport: () => ({ center: [5, 52] }) }))).toEqual({
            position: [5, 52],
        });
    });
    it('query without an address → position + query echo, no grounded label', async () => {
        const ctx = baseCtx({ geocodeAreas: async () => [place('p', {})] }); // point at [-0.12, 51.5], no address
        expect(await resolveNearby({ queries: [{ query: 'Schiphol', queryAs: 'poi' }] }, ctx)).toEqual({
            position: [-0.12, 51.5],
            query: 'Schiphol',
        });
    });
    it('query with one match → carries the grounded label', async () => {
        const schiphol = addrPlace('s', [4.7, 52.3, 4.82, 52.32], 'Schiphol', 'NL');
        const ctx = baseCtx({ viewport: () => ({ center: [4.9, 52.35] }), geocodeAreas: async () => [schiphol] });
        const r = await resolveNearby({ queries: [{ query: 'Schiphol', queryAs: 'poi' }] }, ctx);
        expect(r.label).toBe('Schiphol, NL');
        expect(r.query).toBe('Schiphol');
    });
    it('unresolvable query → empty resolution (NOT an error)', async () => {
        expect(await resolveNearby({ queries: [{ query: 'zzz' }] }, baseCtx())).toEqual({});
    });
    it('empty where → empty resolution', async () => {
        expect(await resolveNearby({}, baseCtx())).toEqual({});
    });
});

describe('resolveWithin — robustness', () => {
    it('skips a degenerate (empty-coordinates) polygon instead of crashing on an undefined bbox', async () => {
        // bboxFromGeoJSON returns undefined for empty coords; the branch must skip it (no push of an
        // undefined bbox, no throw) → an empty areas array that callers handle.
        const r = await resolveWithin({ geometries: [{ type: 'Polygon', coordinates: [] } as never] }, baseCtx());
        expect(r).toEqual([]);
    });

    it('keeps only the valid polygon when a degenerate one is mixed in', async () => {
        const valid = polygonFeature([0, 0, 2, 2]).geometry;
        const r = await resolveWithin(
            { geometries: [valid, { type: 'Polygon', coordinates: [] } as never] },
            baseCtx(),
        );
        expect(Array.isArray(r)).toBe(true);
        expect((r as ResolvedArea[]).length).toBe(1);
        expect((r as ResolvedArea[])[0].bbox).toEqual([0, 0, 2, 2]);
    });

    it('passes through a zero-size boundingBox when supplied', async () => {
        const r = await resolveWithin({ boundingBox: [0, 0, 0, 0] }, baseCtx());
        expect(r).toEqual([{ bbox: [0, 0, 0, 0], source: 'boundingBox' }]);
    });
});

describe('resolveWithin — nearest-to-view disambiguation', () => {
    it('picks the same-name area nearest the viewport (e.g. Westminster, Maryland, not London)', async () => {
        const ctx = baseCtx({
            viewport: () => ({ center: [-76.95, 39.55] }), // Maryland
            geocodeAreas: async () => [
                place('md', { bbox: [-77, 39.5, -76.9, 39.6] }), // Westminster, Maryland (top-ranked, nearest)
                place('ldn', { bbox: [-0.18, 51.49, -0.12, 51.51] }), // Westminster, London (far)
            ],
        });
        const r = await resolveWithin({ queries: [{ query: 'Westminster' }] }, ctx);
        expect(r).toEqual([expect.objectContaining({ source: 'query', bbox: [-77, 39.5, -76.9, 39.6] })]);
    });
});
