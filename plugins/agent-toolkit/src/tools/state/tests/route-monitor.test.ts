import type { Routes } from '@tomtom-org/maps-sdk/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutingState } from '../../../state';
import { executeStartRouteMonitor } from '../start-route-monitor';
import { executeStopRouteMonitor } from '../stop-route-monitor';

// Spread the real module (set-route.ts, imported transitively, reads `routeTypes`/`avoidableTypes`
// at load) and override only calculateRoute.
vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>();
    return { ...actual, calculateRoute: vi.fn() };
});

import { calculateRoute } from '@tomtom-org/maps-sdk/services';

const mockCalculateRoute = calculateRoute as ReturnType<typeof vi.fn>;
const fakeRoutes = (): Routes => ({ type: 'FeatureCollection', features: [{}] }) as unknown as Routes;

const makeState = () => ({ routing: new RoutingState({} as any) }) as any;

const seedRoute = (state: any): string => {
    const id = `routes-${state.routing.entries.length}`;
    // addRoutes is sync here (no map work); waypoints + params are what the recalc closure replays.
    void state.routing.addRoutes(
        fakeRoutes(),
        [
            [4.9, 52.4],
            [4.4, 51.2],
        ] as any,
        'Paris to Amsterdam',
    );
    return id;
};

describe('executeStartRouteMonitor', () => {
    const toStop: { state: any; id: string }[] = [];
    beforeEach(() => mockCalculateRoute.mockReset());
    afterEach(() => {
        for (const { state, id } of toStop) state.routing.stopMonitoring(id);
        toStop.length = 0;
    });

    it('errors when the entry does not exist', async () => {
        const result = await executeStartRouteMonitor({ routesEntryID: 'missing' }, makeState());
        expect('error' in result).toBe(true);
        if ('error' in result) expect(result.error).toContain('missing');
    });

    it('arms recalculation and is idempotent on a second call', async () => {
        mockCalculateRoute.mockResolvedValue(fakeRoutes());
        const state = makeState();
        const id = seedRoute(state);
        toStop.push({ state, id });

        const first = await executeStartRouteMonitor({ routesEntryID: id, intervalMs: 30_000 }, state);
        expect(first).toMatchObject({ routesEntryID: id, alreadyRunning: false });
        expect(state.routing.isMonitored(id)).toBe(true);

        const second = await executeStartRouteMonitor({ routesEntryID: id }, state);
        expect(second).toMatchObject({ routesEntryID: id, alreadyRunning: true });
    });

    it('recalculates the SAME waypoints each tick (eager tick replays entry.waypoints)', async () => {
        mockCalculateRoute.mockResolvedValue(fakeRoutes());
        const state = makeState();
        const id = seedRoute(state);
        toStop.push({ state, id });

        await executeStartRouteMonitor({ routesEntryID: id }, state);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockCalculateRoute).toHaveBeenCalledWith(
            expect.objectContaining({
                locations: [
                    [4.9, 52.4],
                    [4.4, 51.2],
                ],
            }),
        );
    });
});

describe('executeStopRouteMonitor', () => {
    beforeEach(() => mockCalculateRoute.mockReset());

    it('errors when the entry does not exist', async () => {
        const result = await executeStopRouteMonitor({ routesEntryID: 'missing' }, makeState());
        expect('error' in result).toBe(true);
    });

    it('reports wasRunning: false when no monitor was active', async () => {
        const state = makeState();
        const id = seedRoute(state);
        const result = await executeStopRouteMonitor({ routesEntryID: id }, state);
        expect(result).toMatchObject({ routesEntryID: id, wasRunning: false });
    });

    it('stops a running monitor and leaves the entry intact', async () => {
        mockCalculateRoute.mockResolvedValue(fakeRoutes());
        const state = makeState();
        const id = seedRoute(state);
        await executeStartRouteMonitor({ routesEntryID: id }, state);
        expect(state.routing.isMonitored(id)).toBe(true);

        const result = await executeStopRouteMonitor({ routesEntryID: id }, state);
        expect(result).toMatchObject({ routesEntryID: id, wasRunning: true });
        expect(state.routing.isMonitored(id)).toBe(false);
        expect(state.routing.entries.find((e: any) => e.id === id)).toBeDefined();
    });
});
