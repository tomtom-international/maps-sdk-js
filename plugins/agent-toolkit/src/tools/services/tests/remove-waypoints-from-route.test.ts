import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutingState } from '../../../state';
import { makeMockCalculatedRoutes, makeMockState } from '../../../tests/constants';
import { executeRemoveWaypointsFromRoute } from '../remove-waypoints-from-route';

const routing = new RoutingState({} as TomTomMap);

// Seed a real routing entry so state.routing.currentWaypoints (the last entry's waypoints)
// returns these three bare [lng, lat] waypoints.
const seedRoute = async (waypoints: WaypointLike[]) => {
    await routing.addRoutes(makeMockCalculatedRoutes(), waypoints, 'seed');
};

describe('executeRemoveWaypointsFromRoute', () => {
    beforeEach(async () => {
        await seedRoute([
            [0, 0],
            [1, 1],
            [2, 2],
        ]);
    });

    afterEach(() => {
        routing.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('rejects duplicate indices', async () => {
        const result = await executeRemoveWaypointsFromRoute(
            { waypointIndices: [0, 0], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({ error: 'Duplicate waypoint indices are not allowed.' });
    });

    it('rejects an out-of-range index', async () => {
        const result = await executeRemoveWaypointsFromRoute(
            { waypointIndices: [5], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({ error: 'Invalid waypoint index 5. Valid range is 0 to 2.' });
    });

    // Removing waypoints so fewer than 2 would remain is rejected before any recalculation —
    // at least 2 waypoints (origin and destination) must always remain.
    it('rejects a removal that would leave fewer than 2 waypoints', async () => {
        const result = await executeRemoveWaypointsFromRoute(
            { waypointIndices: [0, 1], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({
            error: 'Cannot remove waypoints: at least 2 waypoints (origin and destination) must remain.',
        });
    });

    it('recalculates with the remaining waypoints and writes a new routing entry', async () => {
        const calculateRouteSpy = vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValue(makeMockCalculatedRoutes());

        const result = await executeRemoveWaypointsFromRoute(
            { waypointIndices: [1], showOnMap: false },
            makeMockState({ routing }),
        );
        if ('error' in result) expect.fail('expected removal to succeed');

        expect(calculateRouteSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                locations: [
                    [0, 0],
                    [2, 2],
                ],
            }),
        );
        // seed entry (routes-0) plus the recalculated entry (routes-1).
        expect(routing.entries).toHaveLength(2);
        expect(result.entryId).toBe(routing.entries[1].id);
    });
});

// With no existing route or waypoints in state, an error is returned instead of crashing or
// silently doing nothing.
describe('executeRemoveWaypointsFromRoute — no existing route', () => {
    afterEach(() => {
        routing.reset();
    });

    it('returns an error when there are no existing waypoints', async () => {
        const result = await executeRemoveWaypointsFromRoute(
            { waypointIndices: [0], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({
            error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
        });
    });
});
