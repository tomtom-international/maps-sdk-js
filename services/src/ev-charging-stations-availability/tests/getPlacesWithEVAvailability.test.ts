import type { CommonPlaceProps, Place, Places } from '@tomtom-org/maps-sdk/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getPlacesWithEVAvailability, getPlaceWithEVAvailability } from '../evChargingStationsAvailability';

vi.mock('../../shared/serviceTemplate', () => ({ callService: vi.fn() }));

const { callService } = await import('../../shared/serviceTemplate');
const mockCallService = vi.mocked(callService);

const makeEvPlace = (availabilityId: string): Place<CommonPlaceProps> =>
    ({
        type: 'Feature',
        id: `place-${availabilityId}`,
        geometry: { type: 'Point', coordinates: [4.9, 52.3] },
        properties: {
            type: 'POI',
            dataSources: { chargingAvailability: { id: availabilityId } },
            poi: { name: 'Charger' },
            chargingPark: { connectors: [] },
        },
    }) as unknown as Place<CommonPlaceProps>;

const makePlaces = (...availabilityIds: string[]): Places<CommonPlaceProps> =>
    ({
        type: 'FeatureCollection',
        features: availabilityIds.map(makeEvPlace),
    }) as unknown as Places<CommonPlaceProps>;

const availabilityResponse = {
    id: 'avail',
    accessType: 'public',
    chargingStations: [],
    chargingPointAvailability: { count: 1, statusCounts: {} },
    connectorAvailabilities: [],
};

afterEach(() => mockCallService.mockReset());

describe('getPlaceWithEVAvailability', () => {
    test('forwards common service parameters (alongside the resolved id) to the availability request', async () => {
        mockCallService.mockResolvedValue(availabilityResponse);
        const onAPIRequest = vi.fn();

        await getPlaceWithEVAvailability(makeEvPlace('park-1'), {
            apiKey: 'explicit-key',
            customServiceBaseURL: 'https://example.com/',
            validateRequest: false,
            onAPIRequest,
        });

        expect(mockCallService).toHaveBeenCalledTimes(1);
        expect(mockCallService).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'park-1',
                apiKey: 'explicit-key',
                customServiceBaseURL: 'https://example.com/',
                validateRequest: false,
                onAPIRequest,
            }),
            expect.anything(),
            'EVChargingStationsAvailability',
        );
    });

    test('works without common parameters, passing only the resolved id', async () => {
        mockCallService.mockResolvedValue(availabilityResponse);

        await getPlaceWithEVAvailability(makeEvPlace('park-1'));

        expect(mockCallService).toHaveBeenCalledWith({ id: 'park-1' }, expect.anything(), expect.anything());
    });
});

describe('getPlacesWithEVAvailability', () => {
    test('forwards common service parameters to every per-place availability request', async () => {
        mockCallService.mockResolvedValue(availabilityResponse);
        const onAPIRequest = vi.fn();

        await getPlacesWithEVAvailability(makePlaces('park-1', 'park-2'), {
            apiKey: 'explicit-key',
            customServiceBaseURL: 'https://example.com/',
            onAPIRequest,
        });

        expect(mockCallService).toHaveBeenCalledTimes(2);
        for (const [params] of mockCallService.mock.calls) {
            expect(params).toMatchObject({
                apiKey: 'explicit-key',
                customServiceBaseURL: 'https://example.com/',
                onAPIRequest,
            });
        }
        expect(mockCallService.mock.calls[0][0]).toMatchObject({ id: 'park-1' });
        expect(mockCallService.mock.calls[1][0]).toMatchObject({ id: 'park-2' });
    });

    test('does not leak the excludeIfAvailabilityUnknown option into the availability request params', async () => {
        mockCallService.mockResolvedValue(availabilityResponse);

        await getPlacesWithEVAvailability(makePlaces('park-1'), {
            apiKey: 'explicit-key',
            excludeIfAvailabilityUnknown: true,
        });

        expect(mockCallService.mock.calls[0][0]).not.toHaveProperty('excludeIfAvailabilityUnknown');
        expect(mockCallService.mock.calls[0][0]).toMatchObject({ id: 'park-1', apiKey: 'explicit-key' });
    });
});
