import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import * as sdkServices from '@tomtom-org/maps-sdk/services';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlacesState } from '../../../state';
import { makeMockState, makeRevGeoPlace } from '../../../tests/constants';
import { executeReverseGeocode } from '../reverse-geocode';

const places = new PlacesState({} as TomTomMap);

describe('executeReverseGeocode', () => {
    // Reset places after every test so each test starts from an empty entries array — a real
    // state instance carries whatever was written to it by the previous test otherwise, since
    // clearAllMocks/restoreAllMocks only reset vi.fn() mocks, not this class's own entries.
    afterEach(() => {
        places.reset();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // The position is passed through to reverseGeocode, the response is summarized into place
    // fields, and a real places entry is written with the returned id.
    it('resolves a position and writes a real places entry', async () => {
        const mockCoordinates = [-0.118092, 51.509865];
        const mockPlace = makeRevGeoPlace({
            id: 'place-london',
            geometry: { type: 'Point', coordinates: mockCoordinates },
            properties: {
                type: 'Geography',
                address: { freeformAddress: 'London, UK' },
                originalPosition: mockCoordinates,
            },
        });
        const reverseGeocodeSpy = vi.spyOn(sdkServices, 'reverseGeocode').mockResolvedValue(mockPlace);

        const result = await executeReverseGeocode({ position: mockCoordinates }, makeMockState({ places }));
        if ('error' in result) {
            expect.fail('expected executeReverseGeocode to succeed');
        }

        expect(reverseGeocodeSpy).toHaveBeenCalledWith(expect.objectContaining({ position: mockCoordinates }));
        expect(result).toMatchObject({
            id: 'place-london',
            type: 'Geography',
            address: 'London, UK',
        });
        expect(places.entries).toHaveLength(1);
        expect(places.entries[0].id).toBe(result.placesEntryId);
    });

    // A thrown service error is caught and surfaced as an error result, and no places
    // entry is written.
    it('returns an error when the service call throws', async () => {
        vi.spyOn(sdkServices, 'reverseGeocode').mockRejectedValue(new Error('network down'));

        const result = await executeReverseGeocode({ position: [0, 0] }, makeMockState({ places }));

        expect(result).toEqual({ error: 'Reverse geocoding failed: network down' });
        expect(places.entries).toHaveLength(0);
    });

    // reverseGeocode can return a Feature with no properties when nothing matches, e.g. a pin
    // dropped in open ocean. That case is treated as no result, and no places entry is written.
    it('returns "no result" and writes no state entry on a phantom Feature with no properties — e.g. an ocean pin', async () => {
        const oceanPin = {
            type: 'Feature',
            id: 'ocean-pin',
            geometry: { type: 'Point', coordinates: [-30, 0] },
            properties: undefined,
        } as any;
        vi.spyOn(sdkServices, 'reverseGeocode').mockResolvedValue(oceanPin);

        const result = await executeReverseGeocode({ position: [-30, 0] }, makeMockState({ places }));

        expect(result).toEqual({ error: 'No result found for the given coordinates' });
        expect(places.entries).toHaveLength(0);
    });

    // A sparse-but-real address record (only a freeform label, no other properties) still
    // resolves normally and writes a real places entry.
    it('resolves a sparse address record (e.g. a ferry crossing) with minimal properties', async () => {
        const ferryCrossing = makeRevGeoPlace({
            id: 'ferry-crossing',
            properties: {
                type: 'Geography',
                address: { freeformAddress: 'North Sea Ferry Crossing' },
                originalPosition: [4.5, 53],
            },
        });
        vi.spyOn(sdkServices, 'reverseGeocode').mockResolvedValue(ferryCrossing);

        const result = await executeReverseGeocode({ position: [4.5, 53] }, makeMockState({ places }));
        if ('error' in result) expect.fail('expected executeReverseGeocode to succeed');

        expect(result.address).toBe('North Sea Ferry Crossing');
        expect(places.entries).toHaveLength(1);
    });
});
