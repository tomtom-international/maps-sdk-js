import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createToolState, PlacesState, RoutingState } from '../state';

const mockMap = {} as any;

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
        (state as any).getPlacesModule = async () => ({ show: async () => undefined, clear: async () => undefined });
        state.addPlaceResult({} as any, 'test');
        await state.addShownEntries(['places-0']);
        state.reset();
        expect(state.entries).toEqual([]);
        expect(state.latestPlace).toBeUndefined();
        expect(state.shownEntryIds.size).toBe(0);
    });
});

describe('PlacesState — shown-entries display', () => {
    let state: PlacesState;
    let showCalls: Array<{ count: number }>;

    beforeEach(() => {
        showCalls = [];
        const stubModule = {
            show: async (collection: { features: unknown[] }) => {
                showCalls.push({ count: collection.features.length });
            },
            clear: async () => {
                showCalls.push({ count: 0 });
            },
        };
        state = new PlacesState(mockMap);
        (state as any).getPlacesModule = async () => stubModule;
    });

    /** Seed N entries with the given feature counts;  */
    const seedPlaces = (perEntry: number[]): string[] => {
        const ids: string[] = [];
        for (const count of perEntry) {
            const features = Array.from({ length: count }, (_, i) => ({
                type: 'Feature',
                id: `f-${ids.length}-${i}`,
                geometry: { type: 'Point', coordinates: [0, 0] },
                properties: {},
            }));
            ids.push(state.addPlaceResult({ type: 'FeatureCollection', features } as never, `entry-${ids.length}`));
        }
        return ids;
    };

    it('setShownEntries replaces the current set', async () => {
        const [id0, id1] = seedPlaces([3, 2]);
        await state.setShownEntries([id0]);
        expect([...state.shownEntryIds]).toEqual([id0]);
        expect(showCalls.at(-1)).toEqual({ count: 3 });

        await state.setShownEntries([id1]);
        expect([...state.shownEntryIds]).toEqual([id1]);
        expect(showCalls.at(-1)).toEqual({ count: 2 });
    });

    it('addShownEntries appends to the current set', async () => {
        const [id0, id1, id2] = seedPlaces([3, 2, 4]);
        await state.setShownEntries([id0]);
        const renderCount = showCalls.length;

        // id0 is already shown (no-op for it), id1 + id2 are new — should trigger one re-render.
        await state.addShownEntries([id0, id1, id2]);

        const sortById = (a: string, b: string) => a.localeCompare(b);
        expect([...state.shownEntryIds].sort(sortById)).toEqual([id0, id1, id2].sort(sortById));
        expect(showCalls.length).toBe(renderCount + 1);
        expect(showCalls.at(-1)).toEqual({ count: 9 }); // 3 + 2 + 4
    });

    it('addShownEntries ignores unknown ids', async () => {
        const [id0] = seedPlaces([3]);
        await state.addShownEntries([id0, 'nope']);
        expect([...state.shownEntryIds]).toEqual([id0]);
        expect(showCalls.at(-1)).toEqual({ count: 3 });
    });

    it('addShownEntries is a no-op when nothing changes', async () => {
        const [id0] = seedPlaces([3]);
        await state.setShownEntries([id0]);
        const renderCount = showCalls.length;
        await state.addShownEntries([id0]);
        expect(showCalls.length).toBe(renderCount);
    });

    it('removeShownEntries removes by id', async () => {
        const [id0, id1] = seedPlaces([3, 2]);
        await state.setShownEntries([id0, id1]);
        expect(showCalls.at(-1)).toEqual({ count: 5 });

        await state.removeShownEntries([id1]);
        expect([...state.shownEntryIds]).toEqual([id0]);
        expect(showCalls.at(-1)).toEqual({ count: 3 });
    });

    it('clearShownEntries empties the set', async () => {
        const [id0, id1] = seedPlaces([3, 2]);
        await state.setShownEntries([id0, id1]);
        await state.clearShownEntries();
        expect(state.shownEntryIds.size).toBe(0);
        expect(showCalls.at(-1)).toEqual({ count: 0 });
    });

    it('clearShownEntries is a no-op when set is empty', async () => {
        seedPlaces([3]);
        const renderCount = showCalls.length;
        await state.clearShownEntries();
        expect(showCalls.length).toBe(renderCount); // no call to show or clear
    });
});

describe('RoutingState', () => {
    it('starts with empty entries', () => {
        const state = new RoutingState(mockMap);
        expect(state.entries).toEqual([]);
    });

    it('appends entries with addRoutes', () => {
        const state = new RoutingState(mockMap);
        const routes = { features: [{ properties: { summary: {} } }] } as any;
        const waypoints = [{ type: 'Feature' }] as any;

        state.addRoutes(routes, waypoints, 'Route A to B');

        expect(state.entries).toHaveLength(1);
        expect(state.entries[0]).toMatchObject({
            id: 'routes-0',
            label: 'Route A to B',
            data: routes,
            waypoints,
        });
    });

    it('auto-increments IDs', () => {
        const state = new RoutingState(mockMap);
        state.addRoutes({} as any, [] as any, 'First');
        state.addRoutes({} as any, [] as any, 'Second');
        expect(state.entries[0].id).toBe('routes-0');
        expect(state.entries[1].id).toBe('routes-1');
    });

    it('currentRoutes returns last entry data', () => {
        const state = new RoutingState(mockMap);
        const r1 = { features: [{ id: 1 }] } as any;
        const r2 = { features: [{ id: 2 }] } as any;

        state.addRoutes(r1, [], 'First');
        state.addRoutes(r2, [], 'Second');

        expect(state.currentRoutes).toBe(r2);
    });

    it('currentWaypoints returns last entry waypoints', () => {
        const state = new RoutingState(mockMap);
        const wp = [{ type: 'Feature' }] as any;
        state.addRoutes({} as any, wp, 'Route');
        expect(state.currentWaypoints).toBe(wp);
    });

    it('addRoutes snapshots current params into entry', () => {
        const state = new RoutingState(mockMap);
        state.setParams({ maxAlternatives: 2, costModel: { routeType: 'fastest' } });
        state.addRoutes({} as any, [] as any, 'Route');
        expect(state.entries[0].params).toEqual({ maxAlternatives: 2, costModel: { routeType: 'fastest' } });
        // Should be a copy, not the same reference
        expect(state.entries[0].params).not.toBe(state.params);
    });

    it('addRoutes syncs planningSlots from waypoints', () => {
        const state = new RoutingState(mockMap);
        const wp = [{ id: 'a' }, { id: 'b' }] as any;
        state.addRoutes({} as any, wp, 'Route');
        expect(state.planningSlots).toEqual(wp);
        // Should be a copy, not the same reference
        expect(state.planningSlots).not.toBe(wp);
    });

    it('reset clears entries and planningSlots', () => {
        const state = new RoutingState(mockMap);
        state.addRoutes({} as any, [], 'Route');
        state.setParams({ maxAlternatives: 2 });
        state.reset();
        expect(state.entries).toEqual([]);
        expect(state.currentRoutes).toBeUndefined();
        expect(state.planningSlots).toEqual([]);
        expect(state.params).toEqual({});
    });
});

describe('createToolState', () => {
    it('includes all built-in slices', () => {
        const state = createToolState(mockMap);
        expect(state.places).toBeInstanceOf(PlacesState);
        expect(state.routing).toBeInstanceOf(RoutingState);
        expect(state.baseMap).toBeDefined();
        expect(state.traffic).toBeDefined();
        expect(state.ranges).toBeDefined();
        expect(state.mapPOIs).toBeDefined();
    });

    it('merges custom slices alongside built-in state', () => {
        const fleet = { vehicles: [], reset: vi.fn() };
        const state = createToolState(mockMap, { fleet });
        expect(state.fleet).toBe(fleet);
        expect(state.places).toBeInstanceOf(PlacesState);
    });

    it('returns base state when no custom slices provided', () => {
        const state = createToolState(mockMap);
        expect(state.places).toBeInstanceOf(PlacesState);
        expect((state as any).fleet).toBeUndefined();
    });
});
