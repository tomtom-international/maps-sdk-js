import { describe, expect, it, vi } from 'vitest';
import type { ToolState } from '../../../types';
import type { GeometriesId } from '../geometries-id';
import { collectInputGeometries } from '../state-inputs';

const mkPolygon = (id: string) => ({
    type: 'Feature' as const,
    id,
    geometry: { type: 'Polygon' as const, coordinates: [[[0, 0]]] },
    properties: {},
});

const place = (id: string): GeometriesId => ({ kind: 'place', id });
const places = (id: string): GeometriesId => ({ kind: 'places', id });
const ranges = (id: string): GeometriesId => ({ kind: 'ranges', id });
const custom = (id: string): GeometriesId => ({ kind: 'custom', id });

// Wraps a fixture polygon with the `_source` tag that `collectInputGeometries` stamps on every
// returned feature so the sandbox can identify which entry each polygon came from.
const tagged = (poly: ReturnType<typeof mkPolygon>, source: GeometriesId) => ({
    ...poly,
    properties: { ...poly.properties, _source: source },
});

describe('collectInputGeometries', () => {
    type FakePlace = {
        id: string;
        properties: { dataSources?: { geometry?: { id: string } } };
    };

    type FakeCustomEntry = { id: string; features: unknown[] };

    const mockState = (opts: {
        placesByOwner?: Record<string, { entryId: string; place: FakePlace }>;
        fetchPlaceGeometry?: (id: string) => Promise<unknown>;
        rangesEntries?: { id: string; ranges: { polygon?: { features: unknown[] } }[] }[];
        placesEntries?: { id: string; places: FakePlace[] }[];
        customEntries?: FakeCustomEntry[];
    }) => {
        const entries = opts.placesEntries ?? [];
        const findPlaceById = (id: string) => {
            if (opts.placesByOwner?.[id]) return opts.placesByOwner[id];
            for (const entry of entries) {
                const place = entry.places.find((p) => p.id === id);
                if (place) return { entryId: entry.id, place };
            }
            return undefined;
        };
        return {
            places: {
                entries,
                findPlaceById,
                fetchPlaceGeometry: opts.fetchPlaceGeometry ?? (async () => undefined),
            },
            ranges: { entries: opts.rangesEntries ?? [] },
            customGeometries: {
                findById: (id: string) => opts.customEntries?.find((e) => e.id === id),
            },
        } as unknown as ToolState;
    };

    const expectError = <T extends { error: string } | unknown>(result: T): { error: string } => {
        if (typeof result === 'object' && result !== null && 'error' in result) return result as { error: string };
        throw new Error('expected error result');
    };
    const expectValue = <V>(result: { value: V } | { error: string }): V => {
        if ('error' in result) throw new Error(`expected value, got error: ${result.error}`);
        return result.value;
    };

    it('errors when geometriesEntryIDs is empty', async () => {
        const state = mockState({});
        const result = await collectInputGeometries([], state);
        expect(expectError(result).error).toMatch(/`geometriesEntryIDs` must contain one or more tagged ids/);
    });

    it('errors with skip-reasons summary when no geometry can be collected', async () => {
        const state = mockState({});
        const result = await collectInputGeometries([place('unknown')], state);
        expect(expectError(result).error).toMatch(/place:unknown: No place with this id/);
    });

    it('skips a place that lacks a geometry data source', async () => {
        const placeWithGeom: FakePlace = { id: 'p1', properties: { dataSources: { geometry: { id: 'g1' } } } };
        const placeNoGeom: FakePlace = { id: 'p2', properties: {} };
        const state = mockState({
            placesByOwner: {
                p1: { entryId: 'e1', place: placeWithGeom },
                p2: { entryId: 'e1', place: placeNoGeom },
            },
            fetchPlaceGeometry: async () => mkPolygon('g1'),
        });
        const value = expectValue(await collectInputGeometries([place('p1'), place('p2')], state));
        expect(value.skipped).toContainEqual(
            expect.objectContaining({
                source: { kind: 'place', id: 'p2' },
                reason: expect.stringMatching(/no geometry data source/i),
            }),
        );
        expect(value.contributingSourceIds).toEqual([place('p1')]);
    });

    it('fetches polygons for a `place` id and tracks the owning places-entry as affected', async () => {
        const p: FakePlace = { id: 'p1', properties: { dataSources: { geometry: { id: 'g1' } } } };
        const polygon = mkPolygon('g1');
        const fetchPlaceGeometry = vi.fn(async () => polygon);
        const state = mockState({
            placesByOwner: { p1: { entryId: 'entry-1', place: p } },
            fetchPlaceGeometry,
        });
        const value = expectValue(await collectInputGeometries([place('p1')], state));
        expect(fetchPlaceGeometry).toHaveBeenCalledWith('p1');
        expect(value.geometries).toEqual([tagged(polygon, place('p1'))]);
        expect(value.sourcePlaces).toEqual([p]);
        expect(value.affectedEntries).toEqual([{ id: 'entry-1', kind: 'places' }]);
        expect(value.contributingSourceIds).toEqual([place('p1')]);
        expect(value.skipped).toEqual([]);
    });

    it('expands `places` entries into every geometry-bearing place', async () => {
        const placeA: FakePlace = { id: 'a', properties: { dataSources: { geometry: { id: 'gA' } } } };
        const placeB: FakePlace = { id: 'b', properties: { dataSources: { geometry: { id: 'gB' } } } };
        const placeNoGeom: FakePlace = { id: 'c', properties: {} };
        const polyA = mkPolygon('gA');
        const polyB = mkPolygon('gB');
        const fetchPlaceGeometry = vi.fn(async (id: string) => (id === 'a' ? polyA : id === 'b' ? polyB : undefined));
        const state = mockState({
            placesEntries: [{ id: 'ev-stations-oost', places: [placeA, placeB, placeNoGeom] }],
            fetchPlaceGeometry,
        });
        const value = expectValue(await collectInputGeometries([places('ev-stations-oost')], state));
        expect(fetchPlaceGeometry).toHaveBeenCalledWith('a');
        expect(fetchPlaceGeometry).toHaveBeenCalledWith('b');
        expect(fetchPlaceGeometry).not.toHaveBeenCalledWith('c');
        expect(value.geometries).toEqual([
            tagged(polyA, places('ev-stations-oost')),
            tagged(polyB, places('ev-stations-oost')),
        ]);
        expect(value.affectedEntries).toEqual([{ id: 'ev-stations-oost', kind: 'places' }]);
        expect(value.contributingSourceIds).toEqual([places('ev-stations-oost')]);
        expect(value.skipped).toEqual([]);
    });

    it('skips a `places` source whose entry is unknown', async () => {
        const state = mockState({});
        const result = await collectInputGeometries([places('missing-entry')], state);
        expect(expectError(result).error).toMatch(/places:missing-entry: No places entry with this id/);
    });

    it('skips a `places` entry with no geometry-bearing places', async () => {
        const placeNoGeom: FakePlace = { id: 'a', properties: {} };
        const state = mockState({
            placesEntries: [{ id: 'addresses', places: [placeNoGeom] }],
        });
        const result = await collectInputGeometries([places('addresses')], state);
        expect(expectError(result).error).toMatch(/places:addresses.*no places with a geometry data source/);
    });

    it('does not double-count a place referenced via both `place` and `places`', async () => {
        const placeA: FakePlace = { id: 'a', properties: { dataSources: { geometry: { id: 'gA' } } } };
        const polyA = mkPolygon('gA');
        const fetchPlaceGeometry = vi.fn(async () => polyA);
        const state = mockState({
            placesEntries: [{ id: 'shared', places: [placeA] }],
            fetchPlaceGeometry,
        });
        const value = expectValue(await collectInputGeometries([place('a'), places('shared')], state));
        expect(fetchPlaceGeometry).toHaveBeenCalledTimes(1);
        // The explicit `place` source wins for the tag — `places` only acts as a fallback.
        expect(value.geometries).toEqual([tagged(polyA, place('a'))]);
        expect(value.contributingSourceIds).toEqual([place('a'), places('shared')]);
        expect(value.affectedEntries).toEqual([{ id: 'shared', kind: 'places' }]);
    });

    it('flattens range polygons from `ranges` sources', async () => {
        const polyA = mkPolygon('rA');
        const polyB = mkPolygon('rB');
        const state = mockState({
            rangesEntries: [
                {
                    id: 'ranges-1',
                    ranges: [{ polygon: { features: [polyA] } }, { polygon: { features: [polyB] } }],
                },
            ],
        });
        const value = expectValue(await collectInputGeometries([ranges('ranges-1')], state));
        expect(value.geometries).toEqual([tagged(polyA, ranges('ranges-1')), tagged(polyB, ranges('ranges-1'))]);
        expect(value.contributingSourceIds).toEqual([ranges('ranges-1')]);
        expect(value.affectedEntries).toEqual([]);
    });

    it('errors when only an unknown `ranges` id is requested', async () => {
        const state = mockState({});
        const result = await collectInputGeometries([ranges('missing')], state);
        expect(expectError(result).error).toMatch(/ranges:missing: No ranges entry with this id/);
    });

    it('errors when only an empty `ranges` id is requested', async () => {
        const state = mockState({
            rangesEntries: [{ id: 'ranges-1', ranges: [{}] }],
        });
        const result = await collectInputGeometries([ranges('ranges-1')], state);
        expect(expectError(result).error).toMatch(/ranges:ranges-1.*no polygons/);
    });

    it('reads custom-geometries entries and tracks them as affected entries', async () => {
        const polyA = mkPolygon('cA');
        const polyB = mkPolygon('cB');
        const state = mockState({
            customEntries: [{ id: 'bakery-zone', features: [polyA, polyB] }],
        });
        const value = expectValue(await collectInputGeometries([custom('bakery-zone')], state));
        expect(value.geometries).toEqual([tagged(polyA, custom('bakery-zone')), tagged(polyB, custom('bakery-zone'))]);
        expect(value.affectedEntries).toEqual([{ id: 'bakery-zone', kind: 'custom' }]);
        expect(value.contributingSourceIds).toEqual([custom('bakery-zone')]);
    });

    it('skips an unknown `custom` id', async () => {
        const state = mockState({});
        const result = await collectInputGeometries([custom('nope')], state);
        expect(expectError(result).error).toMatch(/custom:nope: No custom-geometries entry/);
    });

    it('skips an empty `custom` entry', async () => {
        const state = mockState({ customEntries: [{ id: 'empty', features: [] }] });
        const result = await collectInputGeometries([custom('empty')], state);
        expect(expectError(result).error).toMatch(/custom:empty.*Custom-geometries entry is empty/);
    });

    it('mixes places, ranges, and custom inputs in a single call', async () => {
        const placeA: FakePlace = { id: 'a', properties: { dataSources: { geometry: { id: 'gA' } } } };
        const polyPlace = mkPolygon('gA');
        const polyRange = mkPolygon('rA');
        const polyCustom = mkPolygon('cA');
        const fetchPlaceGeometry = vi.fn(async () => polyPlace);
        const state = mockState({
            placesByOwner: { a: { entryId: 'places-1', place: placeA } },
            fetchPlaceGeometry,
            rangesEntries: [{ id: 'ranges-0', ranges: [{ polygon: { features: [polyRange] } }] }],
            customEntries: [{ id: 'zone', features: [polyCustom] }],
        });
        const value = expectValue(
            await collectInputGeometries([place('a'), ranges('ranges-0'), custom('zone')], state),
        );
        expect(value.geometries).toEqual([
            tagged(polyPlace, place('a')),
            tagged(polyRange, ranges('ranges-0')),
            tagged(polyCustom, custom('zone')),
        ]);
        expect(value.contributingSourceIds).toEqual([place('a'), ranges('ranges-0'), custom('zone')]);
        expect(value.affectedEntries).toEqual([
            { id: 'places-1', kind: 'places' },
            { id: 'zone', kind: 'custom' },
        ]);
    });
});
