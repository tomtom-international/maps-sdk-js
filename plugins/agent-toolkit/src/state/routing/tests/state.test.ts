import { describe, expect, it, vi } from 'vitest';
import { RoutingState } from '../state';

const mockMap = {} as any;

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

describe('RoutingState events', () => {
    it('emits entries-change and planning-change on addRoutes', () => {
        const state = new RoutingState(mockMap);
        const entries = vi.fn();
        const planning = vi.fn();
        state.events.on('entries-change', entries);
        state.events.on('planning-change', planning);
        state.addRoutes({} as any, [{ id: 'a' } as any], 'r');
        expect(entries).toHaveBeenCalledTimes(1);
        expect(planning).toHaveBeenCalledTimes(1);
    });

    it('emits planning-change on setWaypointAt without touching entries', () => {
        const state = new RoutingState(mockMap);
        const entries = vi.fn();
        const planning = vi.fn();
        state.events.on('entries-change', entries);
        state.events.on('planning-change', planning);
        state.setWaypointAt(0, { id: 'origin' } as any);
        expect(planning).toHaveBeenCalledTimes(1);
        expect(entries).not.toHaveBeenCalled();
    });

    it('emits params-change on setParams', () => {
        const state = new RoutingState(mockMap);
        const handler = vi.fn();
        state.events.on('params-change', handler);
        state.setParams({ maxAlternatives: 2 });
        expect(handler).toHaveBeenCalledWith({ maxAlternatives: 2 });
    });

    it('emits analysis-added on addAnalysisToEntry', () => {
        const state = new RoutingState(mockMap);
        state.addRoutes({} as any, [], 'r');
        const handler = vi.fn();
        state.events.on('analysis-added', handler);
        const ok = state.addAnalysisToEntry('routes-0', {
            name: 'summary',
            timestamp: 1,
            outputFormat: 'json',
            data: {},
        });
        expect(ok).toBe(true);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('reset emits all three change events', () => {
        const state = new RoutingState(mockMap);
        const fired: string[] = [];
        state.events.on('entries-change', () => fired.push('entries'));
        state.events.on('planning-change', () => fired.push('planning'));
        state.events.on('params-change', () => fired.push('params'));
        state.reset();
        expect(fired).toEqual(['entries', 'planning', 'params']);
    });
});
