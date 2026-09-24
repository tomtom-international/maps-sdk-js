import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState, RoutingState } from '../../../state';
import { makeGeocodingPlace, makeMockPlace, makeMockState } from '../../../tests/constants';
import { executeLocatePlace } from '../locate-place';

// --- services mock (hoisted by Vitest) ---
// All exports that locate-place + tool-state-where-context import must appear here.
// Missing exports cause a "No X export is defined" runtime error.
vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>();
    return {
        ...actual,
        explorationSearch: vi.fn(),
        search: vi.fn(),
        geocode: vi.fn(),
        geometryData: vi.fn(),
        alongRouteSearch: vi.fn(),
    };
});

import { geocode, search } from '@tomtom-org/maps-sdk/services';

const mockSearch = search as ReturnType<typeof vi.fn>;
const mockGeocode = geocode as ReturnType<typeof vi.fn>;

const featureCollection = <T>(features: T[]) => ({ type: 'FeatureCollection' as const, features });

// --- helpers ---

const makeState = () =>
    ({
        baseMap: {
            mapLibreMap: {
                getBounds: () => ({
                    getWest: () => 2,
                    getSouth: () => 48.7,
                    getEast: () => 2.5,
                    getNorth: () => 49,
                }),
                getZoom: () => 12,
                getCenter: () => ({ lng: 2.29, lat: 48.85 }),
            },
        },
        places: {
            findPlaceById: () => undefined,
            expandEntry: () => undefined,
            fetchPlaceGeometry: async () => undefined,
            addPlaceResult: async (_result: unknown, _label: string) => 'places-0',
            entries: [],
        },
        routing: { entries: [] },
        ranges: { entries: [] },
    }) as any;

// --- Task 14: locate-place nearby delegates to resolveBiasPoint ---

describe('executeLocatePlace — nearby query bias via resolveBiasPoint', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('nearby + query → bias position from the geocoded result', async () => {
        // First search call: locatePlaces (bias lookup for "Eiffel Tower" poi); second: locate "pharmacy".
        mockSearch
            .mockResolvedValueOnce({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 's',
                        geometry: { type: 'Point', coordinates: [2.29, 48.85] },
                        properties: {},
                    },
                ],
            })
            .mockResolvedValueOnce({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        id: 'pharmacy1',
                        geometry: { type: 'Point', coordinates: [2.3, 48.86] },
                        properties: { address: { freeformAddress: 'Paris Pharmacy' }, type: 'POI' },
                    },
                ],
            });

        await executeLocatePlace(
            { query: 'pharmacy', queryAs: 'poi', where: { mode: 'nearby', query: 'Eiffel Tower', queryAs: 'poi' } },
            makeState(),
        );

        // The second search call (pharmacy) must be biased to [2.29, 48.85].
        expect(mockSearch).toHaveBeenCalledWith(
            expect.objectContaining({ geoBias: expect.objectContaining({ position: [2.29, 48.85] }) }),
        );
    });
});

// --- locate-place within delegates to the shared area resolver (item 4) ---

describe('executeLocatePlace — within delegates to resolveWithinAreas', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('within + query → area bbox hard-restricts the final locate', async () => {
        // within.query "Paris" resolves via geocodeAreas (area-restricted geocode) to an area bbox,
        // which becomes the boundingBox bias for the final "Eiffel Tower" POI search.
        mockGeocode.mockResolvedValueOnce(
            featureCollection([
                {
                    type: 'Feature',
                    id: 'paris',
                    bbox: [2.2, 48.8, 2.4, 48.9],
                    geometry: { type: 'Point', coordinates: [2.35, 48.85] },
                    properties: {},
                },
            ]),
        );
        mockSearch.mockResolvedValueOnce(
            featureCollection([
                {
                    type: 'Feature',
                    id: 'eiffel',
                    geometry: { type: 'Point', coordinates: [2.29, 48.85] },
                    properties: { address: { freeformAddress: 'Eiffel Tower' }, type: 'POI' },
                },
            ]),
        );

        const result = await executeLocatePlace(
            { query: 'Eiffel Tower', queryAs: 'poi', where: { mode: 'within', query: 'Paris' } },
            makeState(),
        );

        expect('error' in result).toBe(false);
        // Returns the places entry id it wrote (the contract follow-up tools rely on).
        expect(result).toMatchObject({ placesEntryId: 'places-0' });
        expect(mockSearch).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'Eiffel Tower', geoBias: { boundingBox: [2.2, 48.8, 2.4, 48.9] } }),
        );
    });

    it('within + unresolvable query → strict error (no global fallback)', async () => {
        mockGeocode.mockResolvedValueOnce(featureCollection([]));

        const result = await executeLocatePlace(
            { query: 'Eiffel Tower', queryAs: 'poi', where: { mode: 'within', query: 'Narnia' } },
            makeState(),
        );

        expect(result).toEqual(expect.objectContaining({ error: expect.stringContaining('Could not resolve') }));
        // The final locate must NOT run when the within area fails to resolve.
        expect(mockSearch).not.toHaveBeenCalled();
    });
});

// --- real-state integration tests (spies the sdkServices namespace directly rather than the
// module-level vi.mock above, and asserts against a real PlacesState/RoutingState instance) ---

describe('executeLocatePlace', () => {
    const places = new PlacesState({} as TomTomMap);

    // Reset places after every test so each test starts from an empty entries array — a real
    // state instance carries whatever was written to it by the previous test otherwise, since
    // clearAllMocks/restoreAllMocks only reset vi.fn() mocks, not this class's own entries.
    afterEach(() => {
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // Verifies the default (queryAs: 'place', no where) path dispatches to `geocode`, that the
    // output correctly summarizes the resolved place, and that a real state entry is written.
    it('calls geocode and summarizes the result when queryAs is place', async () => {
        const mockPlace = makeGeocodingPlace({
            id: 'place-london',
            geometry: { type: 'Point', coordinates: [-0.1276, 51.5072] },
        });
        const geocodeSpy = vi.spyOn(sdkServices, 'geocode').mockResolvedValue(featureCollection([mockPlace]));

        const result = await executeLocatePlace({ query: 'London', queryAs: 'place' }, makeMockState({ places }));
        if ('error' in result) {
            expect.fail('expected executeLocatePlace to succeed');
        }

        expect(geocodeSpy).toHaveBeenCalledWith(expect.objectContaining({ query: 'London', limit: 1 }));
        // Proves the result actually went through summarizePlace (id/type/address/position), not just
        // that geocode was called and something was written.
        expect(result).toMatchObject({
            id: 'place-london',
            type: 'Geography',
            address: 'London, UK',
            position: [-0.1276, 51.5072],
        });
        expect(places.entries).toHaveLength(1);
        expect(places.entries[0].id).toBe(result.placesEntryId);
    });

    // Verifies queryAs: 'poi' dispatches to `search` (not `geocode`), and carries the POI name
    // through to the summarized output.
    it('calls search when queryAs is poi', async () => {
        const mockPlace = makeMockPlace({
            id: 'place-eiffel',
            geometry: { type: 'Point', coordinates: [2.2945, 48.8584] },
            properties: {
                type: 'POI',
                address: { freeformAddress: 'Champ de Mars, Paris' },
                poi: { name: 'Eiffel Tower', categories: [], localizedCategories: [] },
            },
        });
        const searchSpy = vi.spyOn(sdkServices, 'search').mockResolvedValue(featureCollection([mockPlace]));
        const geocodeSpy = vi.spyOn(sdkServices, 'geocode');

        const result = await executeLocatePlace({ query: 'Eiffel Tower', queryAs: 'poi' }, makeMockState({ places }));
        if ('error' in result) {
            expect.fail('expected executeLocatePlace to succeed');
        }

        expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ query: 'Eiffel Tower', limit: 1 }));
        expect(geocodeSpy).not.toHaveBeenCalled();
    });

    // Verifies a nearby position bias dispatches to the plural `geocode` (not geocodeOne), with
    // the bias position passed through untouched.
    it('calls geocode with the bias position when where is nearby', async () => {
        const mockPlace = makeGeocodingPlace({
            id: 'place-biased',
            geometry: { type: 'Point', coordinates: [4.9, 52.4] },
        });
        const geocodeSpy = vi
            .spyOn(sdkServices, 'geocode')
            .mockResolvedValue({ type: 'FeatureCollection', features: [mockPlace] });

        const result = await executeLocatePlace(
            { query: 'Amsterdam', queryAs: 'place', where: { mode: 'nearby', position: [4.9, 52.4] } },
            makeMockState({ places }),
        );
        if ('error' in result) {
            expect.fail('expected executeLocatePlace to succeed');
        }

        expect(geocodeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                query: 'Amsterdam',
                geoBias: expect.objectContaining({ position: [4.9, 52.4] }),
            }),
        );
    });

    // Verifies waypointIndex stages the resolved place onto routing's planning slots — a state
    // change the output alone (`waypointIndex` echoed back) doesn't prove happened.
    it('stages the resolved place onto routing when waypointIndex is set', async () => {
        const mockPlace = makeGeocodingPlace({
            id: 'place-origin',
            geometry: { type: 'Point', coordinates: [4.9, 52.4] },
        });
        vi.spyOn(sdkServices, 'geocode').mockResolvedValue(featureCollection([mockPlace]));

        const routing = new RoutingState({} as TomTomMap);
        const result = await executeLocatePlace(
            { query: 'Amsterdam', queryAs: 'place', waypointIndex: 0 },
            makeMockState({ places, routing }),
        );
        if ('error' in result) {
            expect.fail('expected executeLocatePlace to succeed');
        }

        expect(routing.planningSlots[0]).toBe(mockPlace);
        expect(result.waypointIndex).toBe(0);
    });

    // A genuine service failure (not a zero-result response) is caught by executeLocatePlace's catch
    // and wrapped with the "Location resolution failed" prefix, with no state written. Pinning the
    // exact string (not just `toHaveProperty('error')`) proves this branch fired, not another error
    // path. Zero results are a separate, non-throwing branch — see the next test.
    it('wraps a thrown service error as "Location resolution failed", with no state written', async () => {
        vi.spyOn(sdkServices, 'geocode').mockRejectedValue(new Error('Request failed with status code 403'));

        const result = await executeLocatePlace({ query: 'Nowhereville', queryAs: 'place' }, makeMockState({ places }));

        expect(result).toEqual({
            error: 'Location resolution failed: Request failed with status code 403',
        });
        expect(places.entries).toHaveLength(0);
    });

    // The "not found" branch: locatePlace resolves to null WITHOUT throwing, because every path now
    // goes through the plural geocode/search and a zero-result response is an empty FeatureCollection.
    // locate-place.ts's `if (!result)` returns the bare message, with no "Location resolution failed"
    // wrapping since nothing threw. Biased and unbiased behave the same way here.
    it('returns "No result found" (not wrapped) when a search yields zero results', async () => {
        vi.spyOn(sdkServices, 'geocode').mockResolvedValue({ type: 'FeatureCollection', features: [] });

        const result = await executeLocatePlace(
            { query: 'Nowhereville', queryAs: 'place', where: { mode: 'nearby', position: [4.9, 52.4] } },
            makeMockState({ places }),
        );

        expect(result).toEqual({ error: 'No result found for "Nowhereville"' });
        expect(places.entries).toHaveLength(0);
    });
});
