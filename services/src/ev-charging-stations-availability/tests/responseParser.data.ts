import type { ChargingStationsAvailability } from '@tomtom-org/maps-sdk/core';
import type { ChargingStationsAvailabilityResponseAPI } from '../types/apiTypes';

export const apiAndParsedResponses: Array<
    [string, ChargingStationsAvailabilityResponseAPI, ChargingStationsAvailability]
> = [
    [
        'Parsing actual API response',
        {
            summary: { numResults: 1, offset: 0, totalResults: 1 },
            results: [
                {
                    id: '1f46c10e-ce37-4e99-8fdf-db22afe9c90b',
                    name: 'TotalEnergies',
                    position: { lat: 52.379945, lon: 4.8768469 },
                    chargingStations: [
                        {
                            id: '7e159ce2-1336-11ed-91de-42010aa40034',
                            chargingPoints: [
                                {
                                    capabilities: ['RemoteStartStopCapable', 'RfidReader'],
                                    connectors: [
                                        {
                                            id: '2',
                                            currentA: 25,
                                            currentType: 'AC3',
                                            ratedPowerKW: 17,
                                            chargingSpeed: 'regular',
                                            type: 'IEC62196Type2Outlet',
                                            voltageV: 230,
                                        },
                                    ],
                                    evseId: 'NL-GFX-ETNLP010397-2',
                                    restrictions: [],
                                    status: 'Occupied',
                                },
                                {
                                    capabilities: ['RemoteStartStopCapable', 'RfidReader'],
                                    connectors: [
                                        {
                                            id: '1',
                                            currentA: 25,
                                            currentType: 'AC3',
                                            ratedPowerKW: 17,
                                            chargingSpeed: 'slow',
                                            type: 'IEC62196Type2Outlet',
                                            voltageV: 230,
                                        },
                                    ],
                                    evseId: 'NL-GFX-ETNLP010397-1',
                                    restrictions: [],
                                    status: 'Available',
                                },
                            ],
                        },
                    ],
                    openingHours: {
                        mode: 'nextSevenDays',
                        timeRanges: [
                            {
                                startTime: { date: '2024-04-25', hour: 0, minute: 0 },
                                endTime: { date: '2024-05-02', hour: 0, minute: 0 },
                            },
                        ],
                    },
                    timeZone: { ianaId: 'Europe/Amsterdam' },
                    accessType: 'Public',
                },
            ],
        },
        {
            id: '1f46c10e-ce37-4e99-8fdf-db22afe9c90b',
            accessType: 'Public',
            chargingStations: [
                {
                    id: '7e159ce2-1336-11ed-91de-42010aa40034',
                    chargingPoints: [
                        {
                            capabilities: ['RemoteStartStopCapable', 'RfidReader'],
                            restrictions: [],
                            connectors: [
                                {
                                    id: '2',
                                    currentA: 25,
                                    currentType: 'AC3',
                                    ratedPowerKW: 17,
                                    chargingSpeed: 'regular',
                                    type: 'IEC62196Type2Outlet',
                                    voltageV: 230,
                                },
                            ],
                            evseId: 'NL-GFX-ETNLP010397-2',
                            status: 'Occupied',
                        },
                        {
                            capabilities: ['RemoteStartStopCapable', 'RfidReader'],
                            restrictions: [],
                            connectors: [
                                {
                                    id: '1',
                                    currentA: 25,
                                    currentType: 'AC3',
                                    ratedPowerKW: 17,
                                    chargingSpeed: 'regular',
                                    type: 'IEC62196Type2Outlet',
                                    voltageV: 230,
                                },
                            ],
                            evseId: 'NL-GFX-ETNLP010397-1',
                            status: 'Available',
                        },
                    ],
                },
            ],
            chargingPointAvailability: {
                count: 2,
                statusCounts: { Occupied: 1, Available: 1 },
            },
            connectorAvailabilities: [
                {
                    connector: {
                        id: '2',
                        currentA: 25,
                        currentType: 'AC3',
                        ratedPowerKW: 17,
                        chargingSpeed: 'regular',
                        type: 'IEC62196Type2Outlet',
                        voltageV: 230,
                    },
                    count: 2,
                    statusCounts: { Occupied: 1, Available: 1 },
                },
            ],
            openingHours: {
                mode: 'nextSevenDays',
                timeRanges: [
                    {
                        start: {
                            date: new Date('2024-04-25T00:00:00'),
                            dateYYYYMMDD: '2024-04-25',
                            year: 2024,
                            month: 4,
                            day: 25,
                            hour: 0,
                            minute: 0,
                        },
                        end: {
                            date: new Date('2024-05-02T00:00:00'),
                            dateYYYYMMDD: '2024-05-02',
                            year: 2024,
                            month: 5,
                            day: 2,
                            hour: 0,
                            minute: 0,
                        },
                    },
                ],
                alwaysOpenThisPeriod: true,
            },
        },
    ],
    [
        'API response with multiple connector types & multiple occupancy status',
        {
            summary: { numResults: 1, offset: 0, totalResults: 1 },
            results: [
                {
                    id: '250009012810643',
                    name: 'Test Station',
                    position: { lat: 48.8566, lon: 2.3522 },
                    openingHours: {
                        mode: 'nextSevenDays',
                        timeRanges: [],
                    },
                    timeZone: { ianaId: 'Europe/Paris' },
                    accessType: 'Restricted',
                    chargingStations: [
                        {
                            id: '00000000-2f1f-ebc3-0000-000000153b86',
                            chargingPoints: [
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2028',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'StandardHouseholdCountrySpecific',
                                            ratedPowerKW: 2.3,
                                            chargingSpeed: 'slow',
                                            voltageV: 230,
                                            currentA: 10,
                                            currentType: 'AC1',
                                        },
                                        {
                                            id: '2',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 22,
                                            chargingSpeed: 'regular',
                                            voltageV: 400,
                                            currentA: 32,
                                            currentType: 'AC3',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2011',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2025',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'StandardHouseholdCountrySpecific',
                                            ratedPowerKW: 2.3,
                                            chargingSpeed: 'slow',
                                            voltageV: 230,
                                            currentA: 10,
                                            currentType: 'AC1',
                                        },
                                        {
                                            id: '2',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 22,
                                            chargingSpeed: 'regular',
                                            voltageV: 400,
                                            currentA: 32,
                                            currentType: 'AC3',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2010',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2CableAttached',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2018',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2026',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'StandardHouseholdCountrySpecific',
                                            ratedPowerKW: 2.3,
                                            chargingSpeed: 'slow',
                                            voltageV: 230,
                                            currentA: 10,
                                            currentType: 'AC1',
                                        },
                                        {
                                            id: '2',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 22,
                                            chargingSpeed: 'regular',
                                            voltageV: 400,
                                            currentA: 32,
                                            currentType: 'AC3',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2016',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2030',
                                    status: 'Occupied',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'StandardHouseholdCountrySpecific',
                                            ratedPowerKW: 2.3,
                                            chargingSpeed: 'slow',
                                            voltageV: 230,
                                            currentA: 10,
                                            currentType: 'AC1',
                                        },
                                        {
                                            id: '2',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 22,
                                            chargingSpeed: 'regular',
                                            voltageV: 400,
                                            currentA: 32,
                                            currentType: 'AC3',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2014',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                                {
                                    capabilities: [],
                                    restrictions: [],
                                    evseId: 'FR*SAE*EHDV*2012',
                                    status: 'Available',
                                    connectors: [
                                        {
                                            id: '1',
                                            type: 'IEC62196Type2Outlet',
                                            ratedPowerKW: 300,
                                            chargingSpeed: 'ultra-fast',
                                            voltageV: 230,
                                            currentA: 32,
                                            currentType: 'AC1',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            id: '250009012810643',
            accessType: 'Restricted',
            chargingStations: [
                {
                    id: '00000000-2f1f-ebc3-0000-000000153b86',
                    chargingPoints: [
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2028',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'StandardHouseholdCountrySpecific',
                                    ratedPowerKW: 2.3,
                                    chargingSpeed: 'slow',
                                    voltageV: 230,
                                    currentA: 10,
                                    currentType: 'AC1',
                                },
                                {
                                    id: '2',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 22,
                                    chargingSpeed: 'regular',
                                    voltageV: 400,
                                    currentA: 32,
                                    currentType: 'AC3',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2011',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
                                    voltageV: 230,
                                    currentA: 32,
                                    currentType: 'AC1',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2025',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'StandardHouseholdCountrySpecific',
                                    ratedPowerKW: 2.3,
                                    chargingSpeed: 'slow',
                                    voltageV: 230,
                                    currentA: 10,
                                    currentType: 'AC1',
                                },
                                {
                                    id: '2',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 22,
                                    chargingSpeed: 'regular',
                                    voltageV: 400,
                                    currentA: 32,
                                    currentType: 'AC3',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2010',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2CableAttached',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
                                    voltageV: 230,
                                    currentA: 32,
                                    currentType: 'AC1',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2018',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
                                    voltageV: 230,
                                    currentA: 32,
                                    currentType: 'AC1',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2026',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'StandardHouseholdCountrySpecific',
                                    ratedPowerKW: 2.3,
                                    chargingSpeed: 'slow',
                                    voltageV: 230,
                                    currentA: 10,
                                    currentType: 'AC1',
                                },
                                {
                                    id: '2',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 22,
                                    chargingSpeed: 'regular',
                                    voltageV: 400,
                                    currentA: 32,
                                    currentType: 'AC3',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2016',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
                                    voltageV: 230,
                                    currentA: 32,
                                    currentType: 'AC1',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2030',
                            status: 'Occupied',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'StandardHouseholdCountrySpecific',
                                    ratedPowerKW: 2.3,
                                    chargingSpeed: 'slow',
                                    voltageV: 230,
                                    currentA: 10,
                                    currentType: 'AC1',
                                },
                                {
                                    id: '2',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 22,
                                    chargingSpeed: 'regular',
                                    voltageV: 400,
                                    currentA: 32,
                                    currentType: 'AC3',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2014',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
                                    voltageV: 230,
                                    currentA: 32,
                                    currentType: 'AC1',
                                },
                            ],
                        },
                        {
                            capabilities: [],
                            restrictions: [],
                            evseId: 'FR*SAE*EHDV*2012',
                            status: 'Available',
                            connectors: [
                                {
                                    id: '1',
                                    type: 'IEC62196Type2Outlet',
                                    ratedPowerKW: 300,
                                    chargingSpeed: 'ultra-fast',
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
                count: 10,
                statusCounts: {
                    Available: 9,
                    Occupied: 1,
                },
            },
            connectorAvailabilities: [
                {
                    connector: {
                        id: '1',
                        type: 'StandardHouseholdCountrySpecific',
                        ratedPowerKW: 2.3,
                        chargingSpeed: 'slow',
                        voltageV: 230,
                        currentA: 10,
                        currentType: 'AC1',
                    },
                    count: 4,
                    statusCounts: { Available: 3, Occupied: 1 },
                },
                {
                    connector: {
                        id: '2',
                        type: 'IEC62196Type2Outlet',
                        ratedPowerKW: 22,
                        chargingSpeed: 'regular',
                        voltageV: 400,
                        currentA: 32,
                        currentType: 'AC3',
                    },
                    count: 4,
                    statusCounts: { Available: 3, Occupied: 1 },
                },
                {
                    connector: {
                        id: '1',
                        type: 'IEC62196Type2Outlet',
                        ratedPowerKW: 300,
                        chargingSpeed: 'ultra-fast',
                        voltageV: 230,
                        currentA: 32,
                        currentType: 'AC1',
                    },
                    count: 5,
                    statusCounts: { Available: 5 },
                },
                {
                    connector: {
                        id: '1',
                        type: 'IEC62196Type2CableAttached',
                        ratedPowerKW: 300,
                        chargingSpeed: 'ultra-fast',
                        voltageV: 230,
                        currentA: 32,
                        currentType: 'AC1',
                    },
                    count: 1,
                    statusCounts: { Available: 1 },
                },
            ],
        },
    ],
    [
        'API response without charging stations',
        {
            summary: { numResults: 1, offset: 0, totalResults: 1 },
            results: [
                {
                    id: '250009044727138',
                    name: 'Empty Station',
                    position: { lat: 0, lon: 0 },
                    openingHours: {
                        mode: 'nextSevenDays',
                        timeRanges: [],
                    },
                    timeZone: { ianaId: 'UTC' },
                    accessType: 'Unknown',
                    chargingStations: [],
                },
            ],
        },
        {
            id: '250009044727138',
            accessType: 'Unknown',
            chargingStations: [],
            chargingPointAvailability: {
                count: 0,
                statusCounts: {},
            },
            connectorAvailabilities: [],
        },
    ],
];
