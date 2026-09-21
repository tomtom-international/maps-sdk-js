import { type RoutingModule, TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState, RoutingState } from '../../../state';
import { makeGeocodingPlace, makeMockCalculatedRoutes, makeMockState } from '../../../tests/constants';
import { executeSetRoute } from '../set-route';

// locatePlaces now uses the plural `geocode`/`search`, which return a FeatureCollection.
const fc = (features: unknown[]) => ({ type: 'FeatureCollection', features }) as any;

const routing = new RoutingState({} as TomTomMap);
// Empty PlacesState so a placeIdOrEntryId lookup legitimately misses (findPlaceById → undefined),
// the real way resolveLocationInput returns null — geocode returns an empty FeatureCollection, and
// throws when nothing matches, so an unresolvable *query* isn't simulated by mocking it falsy.
const places = new PlacesState({} as TomTomMap);

// locations resolve through resolveLocationInput → locatePlace → locatePlaces → geocode (queryAs 'place'),
// which returns Place<GeocodingProps> (requires matchConfidence) — makeGeocodingPlace, not the
// plain makeMockPlace, matches that return type.
const makePlaceAt = (id: string, coordinates: [number, number]) =>
    makeGeocodingPlace({ id, geometry: { type: 'Point', coordinates } });

describe('executeSetRoute', () => {
    afterEach(() => {
        routing.reset();
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('returns an error naming an unresolvable location', async () => {
        const result = await executeSetRoute(
            {
                locations: [{ placeIdOrEntryId: 'missing-london' }, { placeIdOrEntryId: 'missing-paris' }],
                showOnMap: false,
            },
            makeMockState({ routing, places }),
        );

        expect(result).toEqual({
            error: 'Could not resolve: placeIdOrEntryId "missing-london", placeIdOrEntryId "missing-paris"',
        });
        expect(routing.entries).toHaveLength(0);
    });

    it('returns the "not enough waypoints" error when fewer than 2 resolve', async () => {
        vi.spyOn(sdkServices, 'geocode').mockResolvedValue(fc([makePlaceAt('a', [0, 0])]));

        const result = await executeSetRoute(
            { locations: [{ query: 'Solo', queryAs: 'place' }], showOnMap: false },
            makeMockState({ routing }),
        );

        expect(result).toEqual({ error: 'Not enough valid waypoints to calculate a route (minimum 2).' });
        expect(routing.entries).toHaveLength(0);
    });

    it('rejects (does not return a caught error) when calculateRoute throws', async () => {
        vi.spyOn(sdkServices, 'geocode')
            .mockResolvedValueOnce(fc([makePlaceAt('a', [0, 0])]))
            .mockResolvedValueOnce(fc([makePlaceAt('b', [1, 1])]));
        vi.spyOn(sdkServices, 'calculateRoute').mockRejectedValue(new Error('boom'));

        const promise = executeSetRoute(
            {
                locations: [
                    { query: 'A', queryAs: 'place' },
                    { query: 'B', queryAs: 'place' },
                ],
                showOnMap: false,
            },
            makeMockState({ routing }),
        );

        await expect(promise).rejects.toThrow('boom');
        expect(routing.entries).toHaveLength(0);
    });

    it('calculates a route from 2 valid locations and writes a real routing entry', async () => {
        vi.spyOn(sdkServices, 'geocode')
            .mockResolvedValueOnce(fc([makePlaceAt('a', [0, 0])]))
            .mockResolvedValueOnce(fc([makePlaceAt('b', [1, 1])]));
        const calculateRouteSpy = vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValue(makeMockCalculatedRoutes());

        const result = await executeSetRoute(
            {
                locations: [
                    { query: 'A', queryAs: 'place' },
                    { query: 'B', queryAs: 'place' },
                ],
                showOnMap: false,
            },
            makeMockState({ routing }),
        );
        if ('error' in result || 'success' in result) {
            expect.fail('expected executeSetRoute to return a route summary');
        }

        expect(calculateRouteSpy).toHaveBeenCalledTimes(1);
        expect(routing.entries).toHaveLength(1);
        expect(result.entryId).toBe(routing.entries[0].id);
    });

    // showOnMap:true → showRouteOnMap renders the new entry via its RoutingModule and fits the
    // camera to the route's bbox. getEntryRoutingModule lazily builds a real RoutingModule (needs
    // a live map), so it's spied to keep this Node-safe — RoutingState.showEntry's own real
    // bookkeeping (which entry is shown) still runs for real.
    it('shows the route on the map and fits the camera to its bounds when showOnMap is true', async () => {
        vi.spyOn(sdkServices, 'geocode')
            .mockResolvedValueOnce(fc([makePlaceAt('a', [0, 0])]))
            .mockResolvedValueOnce(fc([makePlaceAt('b', [1, 1])]));
        vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValue(makeMockCalculatedRoutes());
        vi.spyOn(routing, 'getEntryRoutingModule').mockResolvedValue({
            showRoutes: vi.fn(),
            showWaypoints: vi.fn(),
            clearWaypoints: vi.fn(),
            applyConfig: vi.fn(),
        } as unknown as RoutingModule);

        const state = makeMockState({ routing });

        const result = await executeSetRoute(
            {
                locations: [
                    { query: 'A', queryAs: 'place' },
                    { query: 'B', queryAs: 'place' },
                ],
                showOnMap: true,
            },
            state,
        );
        if ('error' in result || 'success' in result) {
            expect.fail('expected executeSetRoute to return a route summary');
        }

        expect(routing.shownEntryIds.has(result.entryId)).toBe(true);
        expect(state.baseMap.mapLibreMap.fitBounds).toHaveBeenCalledWith([0, 0, 1, 1], { padding: 50 });
    });

    // Extends the single-route case above: the user requests a route (shown), then — WHILE it's still
    // displayed — requests a second, different route. No `hidePreviousEntries` is passed, so under the
    // default 'multiple' entryMode both stay shown (hidePreviousShownEntries is a no-op when its
    // `selector` is undefined). Pins that the second call doesn't clobber the first entry, and that the
    // camera refits to the SECOND route's own bounds rather than a stale bbox from the first.
    it('shows a second route alongside the first when a new route is requested while one is displayed', async () => {
        vi.spyOn(routing, 'getEntryRoutingModule').mockResolvedValue({
            showRoutes: vi.fn(),
            showWaypoints: vi.fn(),
            clearWaypoints: vi.fn(),
            applyConfig: vi.fn(),
        } as unknown as RoutingModule);

        const state = makeMockState({ routing });

        vi.spyOn(sdkServices, 'geocode')
            .mockResolvedValueOnce(fc([makePlaceAt('a', [0, 0])]))
            .mockResolvedValueOnce(fc([makePlaceAt('b', [1, 1])]));
        vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValueOnce(makeMockCalculatedRoutes());

        const first = await executeSetRoute(
            {
                locations: [
                    { query: 'A', queryAs: 'place' },
                    { query: 'B', queryAs: 'place' },
                ],
                showOnMap: true,
            },
            state,
        );
        if ('error' in first || 'success' in first) {
            expect.fail('expected the first executeSetRoute to return a route summary');
        }

        vi.spyOn(sdkServices, 'geocode')
            .mockResolvedValueOnce(fc([makePlaceAt('c', [2, 2])]))
            .mockResolvedValueOnce(fc([makePlaceAt('d', [3, 3])]));
        vi.spyOn(sdkServices, 'calculateRoute').mockResolvedValueOnce(makeMockCalculatedRoutes({ bbox: [2, 2, 3, 3] }));

        const second = await executeSetRoute(
            {
                locations: [
                    { query: 'C', queryAs: 'place' },
                    { query: 'D', queryAs: 'place' },
                ],
                showOnMap: true,
            },
            state,
        );
        if ('error' in second || 'success' in second) {
            expect.fail('expected the second executeSetRoute to return a route summary');
        }

        expect(routing.entries).toHaveLength(2);
        expect(routing.shownEntryIds.has(first.entryId)).toBe(true);
        expect(routing.shownEntryIds.has(second.entryId)).toBe(true);
        expect(state.baseMap.mapLibreMap.fitBounds).toHaveBeenLastCalledWith([2, 2, 3, 3], { padding: 50 });
    });
});
