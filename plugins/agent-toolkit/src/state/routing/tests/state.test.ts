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

describe('RoutingState — route monitoring', () => {
    const fakeRoutes = (n = 1) =>
        ({ type: 'FeatureCollection', features: Array.from({ length: n }, () => ({})) }) as any;

    // Capturing timer double — drive the recurring tick on demand.
    const fakeTimers = () => {
        let scheduled: (() => void) | undefined;
        return {
            deps: (recalculate: () => Promise<any>) => ({
                recalculate,
                setInterval: (fn: () => void) => {
                    scheduled = fn;
                    return 1;
                },
                clearInterval: () => {},
            }),
            tick: () => scheduled?.(),
        };
    };

    const seed = async (state: RoutingState) => {
        await state.addRoutes(fakeRoutes(), [], 'A to B');
        return state.entries[0].id;
    };

    it('startMonitoring emits monitor-start; a tick updates the entry in place + emits entries-change/monitor-tick', async () => {
        const state = new RoutingState(mockMap);
        const id = await seed(state);
        const events: string[] = [];
        state.events.on('monitor-start', () => events.push('start'));
        state.events.on('monitor-tick', () => events.push('tick'));
        const entryChanges: number[] = [];
        state.events.on('entries-change', (e) => entryChanges.push(e.entries.length));

        const timers = fakeTimers();
        state.startMonitoring(
            id,
            timers.deps(() => Promise.resolve(fakeRoutes(3))),
            { skipInitialTick: true },
        );
        expect(events).toContain('start');
        expect(state.isMonitored(id)).toBe(true);

        timers.tick();
        await Promise.resolve();
        await Promise.resolve();

        expect(events).toContain('tick');
        // The route entry's data was replaced in place — consumers learn via entries-change.
        expect(state.entries[0].data.features).toHaveLength(3);
        expect(entryChanges.at(-1)).toBe(1);

        state.stopMonitoring(id);
    });

    it('stopMonitoring emits monitor-stop (manual) and halts ticks', async () => {
        const state = new RoutingState(mockMap);
        const id = await seed(state);
        const stops: string[] = [];
        state.events.on('monitor-stop', (e) => stops.push(e.reason));

        const timers = fakeTimers();
        const recalculate = vi.fn(() => Promise.resolve(fakeRoutes()));
        state.startMonitoring(id, timers.deps(recalculate), { skipInitialTick: true });
        state.stopMonitoring(id);
        expect(stops).toEqual(['manual']);
        expect(state.isMonitored(id)).toBe(false);

        timers.tick(); // a stale interval fire after stop must not recalculate
        await Promise.resolve();
        expect(recalculate).not.toHaveBeenCalled();
    });

    it('removeEntry stops the monitor', async () => {
        const state = new RoutingState(mockMap);
        const id = await seed(state);
        const timers = fakeTimers();
        state.startMonitoring(
            id,
            timers.deps(() => Promise.resolve(fakeRoutes())),
            { skipInitialTick: true },
        );
        await state.removeEntry(id);
        expect(state.isMonitored(id)).toBe(false);
    });
});

describe('RoutingState — partial display updates', () => {
    // `RoutingModule.applyConfig` replaces the config wholesale, so a partial change has to go through
    // `updateConfig` — otherwise recolouring a route would bring back hidden bubbles and drop layers.
    const stubModule = () => ({
        applyConfig: vi.fn(),
        updateConfig: vi.fn(),
        showRoutes: vi.fn().mockResolvedValue(undefined),
        showWaypoints: vi.fn().mockResolvedValue(undefined),
        clearWaypoints: vi.fn().mockResolvedValue(undefined),
    });

    it('setMainColor updates the theme on a shown module without replacing its config', async () => {
        const state = new RoutingState(mockMap);
        await state.addRoutes({} as any, [] as any, 'A to B');
        const entry = state.entries[0] as any;
        const module = stubModule();
        entry._module = module;
        entry._shown = true;

        state.setMainColor('#ff0000');

        expect(module.updateConfig).toHaveBeenCalledWith({ theme: { mainColor: '#ff0000' } });
        expect(module.applyConfig).not.toHaveBeenCalled();
    });

    it('showEntry applies the sticky colour and bubble visibility as one update', async () => {
        const state = new RoutingState(mockMap);
        await state.addRoutes({} as any, [] as any, 'A to B');
        const entry = state.entries[0] as any;
        const module = stubModule();
        entry._module = module;
        state.setMainColor('#00ff00');

        await state.showEntry(entry.id, { showSummaryBubbles: false });

        expect(module.updateConfig).toHaveBeenCalledWith({
            theme: { mainColor: '#00ff00' },
            summaryBubbles: { visible: false },
        });
        expect(module.applyConfig).not.toHaveBeenCalled();
    });
});

describe('RoutingState — entry id collisions', () => {
    it('never reuses a surviving entry id after removals (add 3, remove first, add again)', async () => {
        const state = new RoutingState(mockMap);
        const routes = { features: [{ properties: { summary: {} } }] } as any;
        const waypoints = [{ type: 'Feature' }] as any;
        await state.addRoutes(routes, waypoints, 'A'); // routes-0
        await state.addRoutes(routes, waypoints, 'B'); // routes-1
        await state.addRoutes(routes, waypoints, 'C'); // routes-2
        await state.removeEntry('routes-0');
        // entries.length is now 2, so a naive length-based id would mint
        // `routes-2` again and collide with the surviving entry.
        await state.addRoutes(routes, waypoints, 'D');
        const ids = state.entries.map((entry) => entry.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
