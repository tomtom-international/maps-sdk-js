import type { WaypointLike } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState, RoutingState } from '../../../state';
import { makeMockCalculatedRoutes, makeMockState } from '../../../tests/constants';
import { executeReplaceWaypointInRoute } from '../replace-waypoint-in-route';

const routing = new RoutingState({} as TomTomMap);
// Empty PlacesState so a placeIdOrEntryId lookup legitimately misses (findPlaceById → undefined),
// the real way resolveLocationInput returns null — geocodeOne itself never resolves to null, it
// throws when nothing matches, so an unresolvable *query* isn't simulated by mocking it falsy.
const places = new PlacesState({} as TomTomMap);

const seedRoute = async (waypoints: WaypointLike[]) => {
    await routing.addRoutes(makeMockCalculatedRoutes(), waypoints, 'seed');
};

describe('executeReplaceWaypointInRoute', () => {
    afterEach(() => {
        routing.reset();
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('returns an error when there are no existing waypoints', async () => {
        const result = await executeReplaceWaypointInRoute(
            { waypointIndex: 'origin', location: { position: [9, 9] }, showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({
            error: 'No existing waypoints available. Use calculate-route first to create a route with waypoints.',
        });
    });

    it('replaces the origin slot and leaves the other waypoints unchanged', async () => {
        await seedRoute([
            [0, 0],
            [1, 1],
            [2, 2],
        ]);
        const calculateRouteSpy = vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValue(makeMockCalculatedRoutes());

        const result = await executeReplaceWaypointInRoute(
            { waypointIndex: 'origin', location: { position: [9, 9] }, showOnMap: false },
            makeMockState({ routing }),
        );
        if ('error' in result) expect.fail('expected replace to succeed');

        expect(calculateRouteSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                locations: [
                    [9, 9],
                    [1, 1],
                    [2, 2],
                ],
            }),
        );
        expect(routing.entries).toHaveLength(2);
        expect(result.entryId).toBe(routing.entries[1].id);
        expect(routing.entries[1].waypoints).toEqual([
            [9, 9],
            [1, 1],
            [2, 2],
        ]);
    });

    it('rejects an out-of-range numeric index', async () => {
        await seedRoute([
            [0, 0],
            [1, 1],
        ]);

        const result = await executeReplaceWaypointInRoute(
            { waypointIndex: 5, location: { position: [9, 9] }, showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({ error: 'Invalid waypoint index 5. Valid range is 0 to 1.' });
        expect(routing.entries).toHaveLength(1);
    });

    it('returns an error when the new location cannot be resolved', async () => {
        await seedRoute([
            [0, 0],
            [1, 1],
        ]);

        const result = await executeReplaceWaypointInRoute(
            { waypointIndex: 'destination', location: { placeIdOrEntryId: 'missing-nowhere' }, showOnMap: false },
            makeMockState({ routing, places }),
        );

        expect(result).toEqual({ error: 'Could not resolve location: placeIdOrEntryId "missing-nowhere"' });
        expect(routing.entries).toHaveLength(1);
    });
});
