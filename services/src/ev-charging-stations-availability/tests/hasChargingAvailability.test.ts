import type { ChargingPark, ChargingParkWithAvailability } from '@tomtom-org/maps-sdk/core';
import { describe, expect, test } from 'vitest';
import { hasChargingAvailability } from '../evChargingStationsAvailability';

describe('hasChargingAvailability', () => {
    test('should return false when chargingPark is undefined', () => {
        expect(hasChargingAvailability(undefined)).toBe(false);
    });

    test('should return false when chargingPark has no availability', () => {
        const chargingPark: ChargingPark = {
            connectors: [
                {
                    connector: {
                        id: '1',
                        type: 'IEC62196Type2Outlet',
                        ratedPowerKW: 7.4,
                        chargingSpeed: 'slow',
                        voltageV: 230,
                        currentA: 32,
                        currentType: 'AC1',
                    },
                    count: 2,
                },
            ],
        };

        expect(hasChargingAvailability(chargingPark)).toBe(false);
    });

    test('should return false when availability property exists but is undefined', () => {
        const chargingPark = {
            connectors: [
                {
                    connector: {
                        id: '1',
                        type: 'IEC62196Type2Outlet',
                        ratedPowerKW: 7.4,
                        chargingSpeed: 'slow',
                        voltageV: 230,
                        currentA: 32,
                        currentType: 'AC1',
                    },
                    count: 2,
                },
            ],
            availability: undefined,
        };

        expect(hasChargingAvailability(chargingPark as unknown as ChargingParkWithAvailability)).toBe(false);
    });

    test('should return true when chargingPark has valid availability data', () => {
        const chargingPark: ChargingParkWithAvailability = {
            connectors: [
                {
                    connector: {
                        id: '1',
                        type: 'IEC62196Type2Outlet',
                        ratedPowerKW: 7.4,
                        chargingSpeed: 'slow',
                        voltageV: 230,
                        currentA: 32,
                        currentType: 'AC1',
                    },
                    count: 2,
                },
            ],
            availability: {
                id: 'park-123',
                accessType: 'Public',
                chargingStations: [
                    {
                        id: 'station-1',
                        chargingPoints: [
                            {
                                evseId: 'point-1',
                                status: 'Available',
                                capabilities: [],
                                restrictions: [],
                                connectors: [
                                    {
                                        id: '1',
                                        type: 'IEC62196Type2Outlet',
                                        ratedPowerKW: 7.4,
                                        chargingSpeed: 'slow',
                                        voltageV: 230,
                                        currentA: 32,
                                        currentType: 'AC1',
                                    },
                                ],
                            },
                        ],
                    },
                ],
                chargingPointAvailability: {
                    count: 2,
                    statusCounts: {
                        Available: 1,
                        Occupied: 1,
                    },
                },
                connectorAvailabilities: [
                    {
                        connector: {
                            id: '1',
                            type: 'IEC62196Type2Outlet',
                            ratedPowerKW: 7.4,
                            chargingSpeed: 'slow',
                            voltageV: 230,
                            currentA: 32,
                            currentType: 'AC1',
                        },
                        count: 2,
                        statusCounts: {
                            Available: 1,
                            Occupied: 1,
                        },
                    },
                ],
            },
        };

        expect(hasChargingAvailability(chargingPark)).toBe(true);
    });

    test('should properly narrow the type when returning true', () => {
        const chargingPark: ChargingPark | ChargingParkWithAvailability = {
            connectors: [],
            availability: {
                id: 'park-123',
                accessType: 'Public',
                chargingStations: [],
                chargingPointAvailability: {
                    count: 0,
                    statusCounts: {},
                },
                connectorAvailabilities: [],
            },
        };

        if (hasChargingAvailability(chargingPark)) {
            // Type should be narrowed to ChargingParkWithAvailability
            const availabilityId: string = chargingPark.availability.id;
            expect(availabilityId).toBe('park-123');
            expect(chargingPark.availability.accessType).toBe('Public');
        }
    });

    test('should handle empty availability object as truthy', () => {
        const chargingPark: ChargingParkWithAvailability = {
            connectors: [],
            availability: {
                id: '',
                accessType: 'Public',
                chargingStations: [],
                chargingPointAvailability: {
                    count: 0,
                    statusCounts: {},
                },
                connectorAvailabilities: [],
            },
        };

        expect(hasChargingAvailability(chargingPark)).toBe(true);
    });
});
