import { afterEach, describe, expect, it, vi } from 'vitest';

// Tools that WRITE a state entry must return the id they wrote, so follow-up tools
// (analyseData / processData) know which entry to read. This locks that contract for the
// route / place producers; discoverPlaces, getTrafficIncidents, etc. already assert it elsewhere.
vi.mock('@tomtom-org/maps-sdk/services', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tomtom-org/maps-sdk/services')>();
    return {
        ...actual,
        calculateRoute: vi.fn(),
        reverseGeocode: vi.fn(),
    };
});

import { calculateRoute, reverseGeocode } from '@tomtom-org/maps-sdk/services';
import { createToolState } from '../../../state';
import type { ToolState } from '../../../types';
import { executeReverseGeocode } from '../reverse-geocode';
import { calculateAndAddRoute } from '../set-route';

const mockCalculateRoute = calculateRoute as ReturnType<typeof vi.fn>;
const mockReverseGeocode = reverseGeocode as ReturnType<typeof vi.fn>;

const mockMap = { mapLibreMap: { getSource: () => undefined, getLayer: () => undefined } } as any;

const fakeRoutes = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.4],
                    [4.4, 51.2],
                ],
            },
            properties: {
                index: 0,
                summary: {
                    travelTimeInSeconds: 7200,
                    lengthInMeters: 210000,
                    departureTime: new Date(0),
                    arrivalTime: new Date(7_200_000),
                },
                sections: { leg: [] },
            },
        },
    ],
} as any;

const fakePlace = {
    type: 'Feature',
    id: 'place-feature-1',
    geometry: { type: 'Point', coordinates: [4.9, 52.4] },
    properties: { address: { freeformAddress: 'Damrak 1, Amsterdam' } },
} as any;

afterEach(() => vi.clearAllMocks());

describe('entry-id returns — route producers', () => {
    it('calculateAndAddRoute returns the routing entry id it wrote', async () => {
        mockCalculateRoute.mockResolvedValueOnce(fakeRoutes);
        const state: ToolState = createToolState(mockMap);

        const result = await calculateAndAddRoute(
            state,
            [
                [4.9, 52.4],
                [4.4, 51.2],
            ] as any,
            false,
        );

        expect(result.entryId).toBe('routes-0');
        // The returned id resolves to a real entry — the contract that lets analyseData read it.
        expect(state.routing.entries.map((e) => e.id)).toContain(result.entryId);
    });
});

describe('entry-id returns — place producers', () => {
    it('reverseGeocode returns the places entry id it wrote', async () => {
        mockReverseGeocode.mockResolvedValueOnce(fakePlace);
        const state: ToolState = createToolState(mockMap);

        const result = await executeReverseGeocode({ position: [4.9, 52.4] }, state);

        if ('error' in result) throw new Error(result.error);
        expect(result.placesEntryId).toBe('places-0');
        expect(state.places.entries.map((e) => e.id)).toContain(result.placesEntryId);
    });
});
