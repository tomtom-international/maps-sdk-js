import { afterEach, describe, expect, it, vi } from 'vitest';
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
        searchOne: vi.fn(),
        geocode: vi.fn(),
        geocodeOne: vi.fn(),
        geometryData: vi.fn(),
        alongRouteSearch: vi.fn(),
    };
});

import { geocode, search } from '@tomtom-org/maps-sdk/services';

const mockSearch = search as ReturnType<typeof vi.fn>;
const mockGeocode = geocode as ReturnType<typeof vi.fn>;

const featureCollection = (features: unknown[]) => ({ type: 'FeatureCollection', features });

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
        expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ position: [2.29, 48.85] }));
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
            expect.objectContaining({ query: 'Eiffel Tower', boundingBox: [2.2, 48.8, 2.4, 48.9] }),
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
