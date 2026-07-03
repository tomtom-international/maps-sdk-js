import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlacesState } from '../state';

const mockMap = {} as any;

// Stub PlacesModule for the shown-set mutators (they call show/clear).
const stubModule = { show: async () => undefined, clear: async () => undefined };

describe('PlacesState — history', () => {
    it('starts with empty entries', () => {
        const state = new PlacesState(mockMap);
        expect(state.entries).toEqual([]);
    });

    it('appends entries with addPlaceResult', () => {
        const state = new PlacesState(mockMap);
        const place = { properties: { poi: { name: 'Cafe' }, address: { freeformAddress: 'Amsterdam' } } } as any;

        state.addPlaceResult(place, 'Cafe, Amsterdam');

        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toMatchObject({
            id: 'places-0',
            label: 'Cafe, Amsterdam',
            data: [place],
        });
        expect(state.entries[0].timestamp).toBeTypeOf('number');
    });

    it('auto-increments IDs', () => {
        const state = new PlacesState(mockMap);
        const p1 = { features: [{ properties: {} }] } as any;
        const p2 = { properties: {} } as any;

        state.addPlaceResult(p1, 'Search results');
        state.addPlaceResult(p2, 'A place');

        expect(state.entries[0].id).toBe('places-0');
        expect(state.entries[1].id).toBe('places-1');
    });

    it('latestPlace returns last entry data', () => {
        const state = new PlacesState(mockMap);
        const p1 = { properties: { poi: { name: 'First' } } } as any;
        const p2 = { properties: { poi: { name: 'Second' } } } as any;

        state.addPlaceResult(p1, 'First');
        state.addPlaceResult(p2, 'Second');

        expect(state.latestPlace).toEqual([p2]);
    });

    it('latestPlace returns undefined when empty', () => {
        const state = new PlacesState(mockMap);
        expect(state.latestPlace).toBeUndefined();
    });

    it('reset clears entries and shown set', async () => {
        const state = new PlacesState(mockMap);
        const stub = { show: async () => undefined, clear: async () => undefined };
        // Per-entry single PlacesModule — same caching shape the real impl uses so the
        // hide/clear paths can find what they cached on `_showEntryAs`.
        (state as any).getEntryPlacesModule = async (id: string) => {
            const entry = state.entries.find((e) => e.id === id) as any;
            entry._modules ??= {};
            entry._modules.places ??= stub;
            return entry._modules.places;
        };
        state.addPlaceResult({} as any, 'test');
        await state.addShownEntries(['places-0'], 'pin');
        state.reset();
        expect(state.entries).toEqual([]);
        expect(state.latestPlace).toBeUndefined();
        expect(state.shownEntryIds.size).toBe(0);
    });

    describe('findPlaceById', () => {
        const makeFeatureCollection = (ids: string[]) =>
            ({
                type: 'FeatureCollection',
                features: ids.map((id) => ({
                    type: 'Feature',
                    id,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: {},
                })),
            }) as any;

        it('returns the matching place and its entry id', () => {
            const state = new PlacesState(mockMap);
            state.addPlaceResult(makeFeatureCollection(['a', 'b']), 'first');
            state.addPlaceResult(makeFeatureCollection(['c', 'd']), 'second');

            const hit = state.findPlaceById('c');
            expect(hit?.entryId).toBe('places-1');
            expect(hit?.place.id).toBe('c');
        });

        it('prefers the most recent entry when the same id appears twice', () => {
            const state = new PlacesState(mockMap);
            state.addPlaceResult(makeFeatureCollection(['shared']), 'old');
            state.addPlaceResult(makeFeatureCollection(['shared']), 'new');

            expect(state.findPlaceById('shared')?.entryId).toBe('places-1');
        });

        it('returns undefined for unknown ids', () => {
            const state = new PlacesState(mockMap);
            state.addPlaceResult(makeFeatureCollection(['a']), 'only');
            expect(state.findPlaceById('missing')).toBeUndefined();
        });

        it('builds each entry cache at most once', () => {
            const state = new PlacesState(mockMap);
            state.addPlaceResult(makeFeatureCollection(['a', 'b']), 'only');

            const entry = state.entries[0] as { _byId?: Record<string, unknown> };
            expect(entry._byId).toBeUndefined();

            state.findPlaceById('a');
            const cacheAfterFirst = entry._byId;
            expect(cacheAfterFirst).toBeDefined();

            state.findPlaceById('b');
            expect(entry._byId).toBe(cacheAfterFirst);
        });
    });

    describe('geometryPlaceIdsForEntry', () => {
        // Feature collection where each id can opt into a geometry data source.
        const makeFeatureCollection = (places: { id: string; geometrySource?: boolean }[]) =>
            ({
                type: 'FeatureCollection',
                features: places.map(({ id, geometrySource }) => ({
                    type: 'Feature',
                    id,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                    properties: { ...(geometrySource && { dataSources: { geometry: { id: `g-${id}` } } }) },
                })),
            }) as any;

        it('expands an entry id to its geometry-bearing place ids only', async () => {
            const state = new PlacesState(mockMap);
            const id = await state.addPlaceResult(
                makeFeatureCollection([
                    { id: 'a', geometrySource: true },
                    { id: 'b' },
                    { id: 'c', geometrySource: true },
                ]),
                'mixed',
            );
            expect(state.geometryPlaceIdsForEntry(id)).toEqual(['a', 'c']);
        });

        it('returns [] when the entry holds no geometry-bearing place', async () => {
            const state = new PlacesState(mockMap);
            const id = await state.addPlaceResult(makeFeatureCollection([{ id: 'a' }, { id: 'b' }]), 'addresses');
            expect(state.geometryPlaceIdsForEntry(id)).toEqual([]);
        });

        it('returns undefined for an unknown entry id (so callers fall back to feature-id lookup)', () => {
            const state = new PlacesState(mockMap);
            expect(state.geometryPlaceIdsForEntry('nope')).toBeUndefined();
        });
    });
});

describe('PlacesState — shown-entries display', () => {
    let state: PlacesState;
    let showCalls: Array<{ marker: 'pin' | 'base-map' | 'pin-clustered'; count: number }>;

    beforeEach(() => {
        showCalls = [];
        const makeStub = (marker: 'pin' | 'base-map' | 'pin-clustered') => ({
            show: async (collection: { features: unknown[] }) => {
                showCalls.push({ marker, count: collection.features.length });
            },
            clear: async () => {
                showCalls.push({ marker, count: 0 });
            },
            // Connections aren't asserted in these tests but `_showEntryAs`
            // calls `module.showConnections(...)` whenever the entry has any,
            // so the stub needs the method to avoid a TypeError.
            showConnections: async () => undefined,
        });
        state = new PlacesState(mockMap);
        // Per-entry single PlacesModule — cache on `entry._modules.places` so subsequent
        // `_hideEntry` calls find the same instance to clear. The stub tracks the marker
        // passed in so theme assertions stay accurate even though one stub serves all themes.
        (state as any).getEntryPlacesModule = async (id: string, marker: 'pin' | 'base-map' | 'pin-clustered') => {
            const entry = state.entries.find((e) => e.id === id) as any;
            entry._modules ??= {};
            entry._modules.places ??= makeStub(marker);
            entry._modules.places._marker = marker;
            return entry._modules.places;
        };
    });

    /** Seed N entries with the given feature counts;  */
    const seedPlaces = async (perEntry: number[]): Promise<string[]> => {
        const ids: string[] = [];
        for (const count of perEntry) {
            const features = Array.from({ length: count }, (_, i) => ({
                type: 'Feature',
                id: `f-${ids.length}-${i}`,
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: {},
            }));
            ids.push(
                await state.addPlaceResult({ type: 'FeatureCollection', features } as never, `entry-${ids.length}`),
            );
        }
        return ids;
    };

    it('setShownEntries replaces the current set', async () => {
        const [id0, id1] = await seedPlaces([3, 2]);
        await state.setShownEntries([id0], 'pin');
        expect([...state.shownEntryIds]).toEqual([id0]);
        expect(showCalls.at(-1)).toEqual({ marker: 'pin', count: 3 });

        await state.setShownEntries([id1], 'pin');
        expect([...state.shownEntryIds]).toEqual([id1]);
        expect(showCalls.at(-1)).toEqual({ marker: 'pin', count: 2 });
    });

    it('addShownEntries appends to the current set', async () => {
        const [id0, id1, id2] = await seedPlaces([3, 2, 4]);
        await state.setShownEntries([id0], 'pin');
        const renderCount = showCalls.length;

        await state.addShownEntries([id0, id1, id2], 'pin');

        const sortById = (a: string, b: string) => a.localeCompare(b);
        expect([...state.shownEntryIds].sort(sortById)).toEqual([id0, id1, id2].sort(sortById));
        // Per-entry rendering — each newly-shown entry triggers its own
        // `show()` call. id0 was already shown so it doesn't re-show; id1
        // and id2 each push one show call with their own feature count.
        expect(showCalls.length).toBe(renderCount + 2);
        const tail = showCalls.slice(-2);
        expect(tail.map((c) => c.count).sort((a, b) => a - b)).toEqual([2, 4]);
    });

    it('addShownEntries ignores unknown ids', async () => {
        const [id0] = await seedPlaces([3]);
        await state.addShownEntries([id0, 'nope'], 'pin');
        expect([...state.shownEntryIds]).toEqual([id0]);
        expect(showCalls.at(-1)).toEqual({ marker: 'pin', count: 3 });
    });

    it('addShownEntries is a no-op when nothing changes', async () => {
        const [id0] = await seedPlaces([3]);
        await state.setShownEntries([id0], 'pin');
        const renderCount = showCalls.length;
        await state.addShownEntries([id0], 'pin');
        expect(showCalls.length).toBe(renderCount);
    });

    it('removeShownEntries removes by id', async () => {
        const [id0, id1] = await seedPlaces([3, 2]);
        await state.setShownEntries([id0, id1], 'pin');
        // Per-entry: two separate shows, one per entry.
        expect(
            showCalls
                .slice(-2)
                .map((c) => c.count)
                .sort((a, b) => a - b),
        ).toEqual([2, 3]);

        await state.removeShownEntries([id1]);
        expect([...state.shownEntryIds]).toEqual([id0]);
        // id1's module emits a `clear` (count 0) when hidden; id0 stays as-is.
        expect(showCalls.at(-1)).toEqual({ marker: 'pin', count: 0 });
    });

    it('clearShownEntries empties the set', async () => {
        const [id0, id1] = await seedPlaces([3, 2]);
        await state.setShownEntries([id0, id1], 'pin');
        const beforeClear = showCalls.length;
        await state.clearShownEntries();
        expect(state.shownEntryIds.size).toBe(0);
        // Two clears (one per entry) — both push `{marker: 'pin', count: 0}`.
        expect(showCalls.length - beforeClear).toBe(2);
        expect(showCalls.slice(-2)).toEqual([
            { marker: 'pin', count: 0 },
            { marker: 'pin', count: 0 },
        ]);
    });

    it('addShownEntries with a different markerType moves the entry', async () => {
        const [id0] = await seedPlaces([3]);
        await state.setShownEntries([id0], 'pin');
        expect(state.getShownMarkerType(id0)).toBe('pin');

        await state.addShownEntries([id0], 'base-map');
        expect(state.getShownMarkerType(id0)).toBe('base-map');
        expect([...state.shownAsPinIds]).toEqual([]);
        expect([...state.shownAsBaseMapIds]).toEqual([id0]);
    });

    it('setShownEntries does not disturb entries in the other marker set', async () => {
        const [id0, id1] = await seedPlaces([3, 2]);
        await state.setShownEntries([id0], 'pin');
        await state.setShownEntries([id1], 'base-map');
        expect([...state.shownAsPinIds]).toEqual([id0]);
        expect([...state.shownAsBaseMapIds]).toEqual([id1]);
    });

    it('clearShownEntries is a no-op when set is empty', async () => {
        await seedPlaces([3]);
        const renderCount = showCalls.length;
        await state.clearShownEntries();
        expect(showCalls.length).toBe(renderCount); // no call to show or clear
    });
});

describe('PlacesState events', () => {
    let state: PlacesState;
    beforeEach(() => {
        state = new PlacesState(mockMap);
        // Per-entry single PlacesModule — cache on `entry._modules.places` like the
        // real implementation so the `_hideEntry` path can find it to clear.
        (state as any).getEntryPlacesModule = async (id: string) => {
            const entry = state.entries.find((e) => e.id === id) as any;
            entry._modules ??= {};
            entry._modules.places ??= stubModule;
            return entry._modules.places;
        };
    });

    it('emits entries-change on addPlaceResult', () => {
        const handler = vi.fn();
        state.events.on('entries-change', handler);
        state.addPlaceResult({} as any, 'first');
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].entries).toHaveLength(1);
    });

    it('emits shown-change on set/add/remove/clear', async () => {
        const id = await state.addPlaceResult(
            { type: 'FeatureCollection', features: [{ type: 'Feature', id: 'p1', properties: {} }] } as any,
            'e',
        );
        const handler = vi.fn();
        state.events.on('shown-change', handler);

        await state.setShownEntries([id], 'pin');
        await state.addShownEntries([id], 'base-map'); // moves to base-map
        await state.removeShownEntries([id]);
        await state.setShownEntries([id], 'pin');
        await state.clearShownEntries();

        // 5 mutations → 5 emits.
        expect(handler).toHaveBeenCalledTimes(5);
    });

    it('addShownEntries that changes nothing does not emit', async () => {
        const id = await state.addPlaceResult({} as any, 'e');
        await state.setShownEntries([id], 'pin');
        const handler = vi.fn();
        state.events.on('shown-change', handler);
        await state.addShownEntries([id], 'pin'); // already shown as pin
        expect(handler).not.toHaveBeenCalled();
    });

    it('emits entries-change on reset and keeps subscribers wired', () => {
        const handler = vi.fn();
        state.events.on('entries-change', handler);
        state.addPlaceResult({} as any, 'e');
        expect(handler).toHaveBeenCalledTimes(1);

        state.reset();
        expect(handler).toHaveBeenCalledTimes(2);

        // Subscribers persist across reset — long-lived UI listeners (a side panel mounted once
        // for the agent's lifetime) must keep receiving updates after the user clears the session.
        state.addPlaceResult({} as any, 'e2');
        expect(handler).toHaveBeenCalledTimes(3);
    });
});
