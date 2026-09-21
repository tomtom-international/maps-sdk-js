import { type RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import type { Feature, Point } from 'geojson';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState, RoutingState } from '../../../state';
import { makeGeocodingPlace, makeMockCalculatedRoutes, makeMockState } from '../../../tests/constants';
import { executeAddWaypointsToRoute } from '../add-waypoints-to-route';

// locatePlaces now uses the plural `geocode`/`search`, which return a FeatureCollection.
const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features }) as any;

const routing = new RoutingState({} as TomTomMap);
// Empty PlacesState so a placeIdOrEntryId lookup legitimately misses (findPlaceById → undefined),
// the real way resolveLocationInput returns null — geocode returns an empty FeatureCollection, and
// throws when nothing matches, so an unresolvable *query* isn't simulated by mocking it falsy.
const places = new PlacesState({} as TomTomMap);

const wp = (lng: number, lat: number): Feature<Point> => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {},
});

// Stub the currentEntryModule getter to model "a route is shown on the map": validateExistingRoute
// reads currentEntryModule.getShown().mainLines / .waypoints. A real RoutingModule can't be built in
// Node (RoutingModule.get needs a live map), so we hand back the minimal shape the tool reads.
const stubShownRoute = () => {
    const lineFeature = makeMockCalculatedRoutes().features[0];
    return {
        getShown: () => ({
            mainLines: { type: 'FeatureCollection', features: [lineFeature] },
            waypoints: { type: 'FeatureCollection', features: [wp(0, 0), wp(1, 1)] },
        }),
    };
};

describe('executeAddWaypointsToRoute', () => {
    afterEach(() => {
        routing.reset();
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('returns an error when there is no route on the map', async () => {
        const result = await executeAddWaypointsToRoute(
            { stops: [{ query: 'Mid', queryAs: 'place' }], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({
            error: 'No existing route on the map. Use calculate-route or updateRoutesDisplay first.',
        });
    });

    it('returns an error naming an unresolvable stop', async () => {
        // Verifies executeAddWaypointsToRoute returns an error identifying the unresolvable stop
        // when a route is shown but the requested placeIdOrEntryId doesn't match any known place.
        const moduleStub = stubShownRoute();
        const result = await executeAddWaypointsToRoute(
            { stops: [{ placeIdOrEntryId: 'missing-mid' }], showOnMap: false },
            makeMockState({ routing: { currentEntryModule: moduleStub } as unknown as RoutingState, places }),
        );

        expect(result).toEqual({ error: 'Could not resolve: placeIdOrEntryId "missing-mid"' });
    });

    it('inserts a resolved stop, recalculates, and writes a new routing entry', async () => {
        const moduleStub = stubShownRoute();
        vi.spyOn(routing, 'currentEntryModule', 'get').mockReturnValue(moduleStub as unknown as RoutingModule);
        vi.spyOn(sdkServices, 'geocode').mockResolvedValue(
            fc([makeGeocodingPlace({ id: 'mid', geometry: { type: 'Point', coordinates: [0.5, 0.5] } })]),
        );
        const calculateRouteSpy = vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValue(makeMockCalculatedRoutes());

        const result = await executeAddWaypointsToRoute(
            { stops: [{ query: 'Mid', queryAs: 'place' }], showOnMap: false },
            makeMockState({ routing }),
        );
        if ('error' in result) expect.fail('expected add-waypoints to succeed');

        expect(calculateRouteSpy).toHaveBeenCalledTimes(1);
        const passedLocations = calculateRouteSpy.mock.calls[0][0].locations;
        // origin + destination (from getShown().waypoints) plus the inserted mid stop.
        expect(passedLocations).toHaveLength(3);
        expect(routing.entries).toHaveLength(1);
        expect(result.entryId).toBe(routing.entries[0].id);
    });
});
