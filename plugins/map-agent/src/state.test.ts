import { describe, expect, it, vi } from 'vitest';
import { createToolState, PlacesState, RoutingState } from './state';

const mockMap = {} as any;

describe('PlacesState', () => {
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

    it('reset clears entries', () => {
        const state = new PlacesState(mockMap);
        state.addPlaceResult({} as any, 'test');
        state.reset();
        expect(state.entries).toEqual([]);
        expect(state.latestPlace).toBeUndefined();
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
