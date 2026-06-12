import type { Route } from '@tomtom-org/maps-sdk/core';
import type { FetchInput } from '../../shared';
import type { CalculateRoutePOSTDataAPI } from '../types/apiRequestTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';

const BASE_URL = 'https://api.tomtom.com';
const V3_URL = new URL(`${BASE_URL}/maps/orbis/routing/routes/calculate`);

const defaultHeaders = (attributes: string) => ({
    'TomTom-Api-Key': 'GLOBAL_API_KEY',
    'TomTom-Api-Version': '3',
    Attributes: attributes,
});

export const sdkAndAPIRequests: [string, CalculateRouteParams, FetchInput<CalculateRoutePOSTDataAPI>][] = [
    [
        'Default A-B route',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'A-B-C route with intermediate waypoint',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.7, 52.25],
                [4.49015, 52.16109],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    waypoints: { type: 'MultiPoint', coordinates: [[4.7, 52.25]] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with routeType and traffic',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            costModel: { routeType: 'fast', traffic: 'live' },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                routeType: 'fast',
                traffic: 'live',
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route avoiding toll roads and motorways',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            costModel: { avoid: ['tollRoads', 'motorways'] },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                avoids: ['tollRoads', 'motorways'],
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with max 2 alternatives',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            maxAlternatives: 2,
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                maxPathAlternativeRoutes: 2,
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with guidance',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            guidance: { type: 'coded', phonetics: 'IPA' },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                guidance: 'instructions',
                instructionPhonetics: 'ipa',
            },
            headers: defaultHeaders(
                'roadShieldAtlasReference,routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,sections.lanes,progressPoints,instructions(*,nextRoadInformation.roadShields.iconReference,previousRoadInformation.roadShields.iconReference,signpost.exitIconReference,distanceToPreviousTrafficLightInMeters))',
            ),
        },
    ],
    [
        'Route with departure time',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            when: { option: 'departAt', date: new Date('2025-10-25T09:30:00.000Z') },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                departureDateTime: '2025-10-25T09:30:00.000Z',
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with arrival time',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            when: { option: 'arriveBy', date: new Date('2025-10-25T14:00:00.000Z') },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                arrivalDateTime: '2025-10-25T14:00:00.000Z',
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with avoid areas',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            costModel: {
                avoidAreas: [[4.5, 52, 4.8, 52.3]],
            },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                avoidAreas: {
                    rectangles: [{ type: 'Feature', bbox: [4.5, 52, 4.8, 52.3], geometry: null }],
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with extended route representations → progressPoints',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            extendedRouteRepresentations: ['distance', 'travelTime'],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with empty sectionTypes omits sections from Attributes header',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: [],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders('routes(summary,legs(summary,path),progressPoints)'),
        },
    ],
    [
        'Route with Accept-Language header when language is set',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            language: 'nl-NL',
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: {
                ...defaultHeaders(
                    'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
                ),
                'Accept-Language': 'nl-NL',
            },
        },
    ],
    [
        'Route with combustion vehicle params',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            vehicle: {
                engineType: 'combustion' as const,
                model: {
                    dimensions: { weightKG: 1500 },
                    engine: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 11.5 },
                            ],
                        },
                    },
                },
                state: { currentFuelInLiters: 45 },
            },
        },
        {
            method: 'POST',
            url: (() => {
                const url = new URL(`${BASE_URL}/maps/orbis/routing/routes/calculate`);
                url.searchParams.set('constantSpeedConsumptionInLitersPerHundredkm', '50,6.3:130,11.5');
                url.searchParams.set('currentFuelInLiters', '45');
                return url;
            })(),
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                vehicleWeightInKilograms: 1500,
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with electric vehicle params (non-LDEVR)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            vehicle: {
                engineType: 'electric' as const,
                model: {
                    dimensions: { weightKG: 2000 },
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 15 },
                                { speedKMH: 120, consumptionUnitsPer100KM: 23 },
                            ],
                        },
                        charging: { maxChargeKWH: 75 },
                    },
                },
                state: { currentChargeInkWh: 50 },
            },
        },
        {
            method: 'POST',
            url: (() => {
                const url = new URL(`${BASE_URL}/maps/orbis/routing/routes/calculate`);
                url.searchParams.set('constantSpeedConsumptionInkWhPerHundredkm', '50,15:120,23');
                url.searchParams.set('maxChargeInkWh', '75');
                url.searchParams.set('currentChargeInkWh', '50');
                return url;
            })(),
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                vehicleEngineType: 'electric',
                vehicleWeightInKilograms: 2000,
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Default A-B route with specific non-EXPLICIT sectionTypes does not add EXPLICIT sub-attrs',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: ['vehicleRestricted', 'traffic', 'ferry'],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders('routes(summary,legs(summary,path),sections,progressPoints)'),
        },
    ],
    [
        'Route with EXPLICIT section types adds individual sections.* sub-attributes to Attributes header',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: ['tollVignette', 'roadShields', 'importantRoadStretch', 'traffic'],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route with EXPLICIT lanes section type and guidance adds sections.lanes to Attributes header',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: ['lanes', 'traffic'],
            guidance: { type: 'coded' as const },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                guidance: 'instructions',
                instructionPhonetics: 'ipa',
            },
            headers: defaultHeaders(
                'roadShieldAtlasReference,routes(summary,legs(summary,path),sections,sections.lanes,progressPoints,instructions(*,nextRoadInformation.roadShields.iconReference,previousRoadInformation.roadShields.iconReference,signpost.exitIconReference,distanceToPreviousTrafficLightInMeters))',
            ),
        },
    ],
    [
        'Route with guidance but sectionTypes excluding lanes omits sections.lanes from Attributes header',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: ['traffic'],
            guidance: { type: 'coded' as const },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                guidance: 'instructions',
                instructionPhonetics: 'ipa',
            },
            headers: defaultHeaders(
                'roadShieldAtlasReference,routes(summary,legs(summary,path),sections,progressPoints,instructions(*,nextRoadInformation.roadShields.iconReference,previousRoadInformation.roadShields.iconReference,signpost.exitIconReference,distanceToPreviousTrafficLightInMeters))',
            ),
        },
    ],
    [
        'Default A-B-C route where B is a GeoJSON point feature',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: {},
                } as unknown as [number, number],
                [4.47059, 51.92291],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.47059, 51.92291] },
                    waypoints: { type: 'MultiPoint', coordinates: [[4.49015, 52.16109]] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Default A-B route where B is a GeoJSON point feature with entry points (V3 uses feature coordinates, ignores entry points)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: { entryPoints: [{ type: 'main', position: [5, 53] }] },
                } as unknown as [number, number],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Default A-s-C route where s is a soft(circle) waypoint (V3 uses feature coordinates, ignores radiusMeters)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: { radiusMeters: 20 },
                } as unknown as [number, number],
                [4.47059, 51.92291],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.47059, 51.92291] },
                    waypoints: { type: 'MultiPoint', coordinates: [[4.49015, 52.16109]] },
                },
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'A-B route with simple vehicle parameters (weight dimensions only, no engineType)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [52.52, 13.405],
                [48.8566, 2.3522],
            ],
            vehicle: { model: { dimensions: { weightKG: 2500 } } },
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [52.52, 13.405] },
                    destination: { type: 'Point', coordinates: [48.8566, 2.3522] },
                },
                vehicleWeightInKilograms: 2500,
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'A-B route with many optional parameters set to non-default values and electric vehicle params',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            language: 'es-ES',
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211],
            ],
            costModel: {
                avoid: [
                    'carpools',
                    'ferries',
                    'motorways',
                    'alreadyUsedRoads',
                    'tollRoads',
                    'unpavedRoads',
                    'borderCrossings',
                    'tunnels',
                    'carTrains',
                    'lowEmissionZones',
                ],
                traffic: 'historical',
                routeType: 'thrilling',
            },
            maxAlternatives: 2,
            vehicle: {
                engineType: 'electric' as const,
                model: {
                    dimensions: { weightKG: 3500 },
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInkW: 1.7,
                            consumptionInKWHPerKMAltitudeGain: 7,
                            recuperationInKWHPerKMAltitudeLoss: 3.8,
                        },
                        charging: { maxChargeKWH: 85 },
                    },
                },
                state: { heading: 45, currentChargePCT: 50 },
                restrictions: { maxSpeedKMH: 60 },
            },
            when: { option: 'arriveBy', date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400)) },
        },
        {
            method: 'POST',
            url: (() => {
                const url = new URL(`${BASE_URL}/maps/orbis/routing/routes/calculate`);
                url.searchParams.set('constantSpeedConsumptionInkWhPerHundredkm', '50,8.2:130,21.3');
                url.searchParams.set('auxiliaryPowerInkW', '1.7');
                url.searchParams.set('consumptionInkWhPerkmAltitudeGain', '7');
                url.searchParams.set('recuperationInkWhPerkmAltitudeLoss', '3.8');
                url.searchParams.set('maxChargeInkWh', '85');
                url.searchParams.set('currentChargeInkWh', '42.5');
                return url;
            })(),
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [3.1748, 42.26297] },
                    destination: { type: 'Point', coordinates: [2.48819, 42.18211] },
                },
                avoids: [
                    'carpools',
                    'ferries',
                    'motorways',
                    'alreadyUsedRoads',
                    'tollRoads',
                    'unpavedRoads',
                    'borderCrossings',
                    'tunnels',
                    'carTrains',
                    'lowEmissionZones',
                ],
                traffic: 'historical',
                routeType: 'thrilling',
                maxPathAlternativeRoutes: 2,
                vehicleEngineType: 'electric',
                vehicleWeightInKilograms: 3500,
                vehicleMaxSpeedInKilometersPerHour: 60,
                vehicleHeadingInDegrees: 45,
                arrivalDateTime: '2022-09-16T15:48:15.400Z',
            },
            headers: {
                ...defaultHeaders(
                    'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
                ),
                'Accept-Language': 'es-ES',
            },
        },
    ],
    [
        'LDEVR A-B Route with vehicle model ID',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [13.492, 52.507],
                [8.624, 50.104],
            ],
            vehicle: {
                engineType: 'electric' as const,
                model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
                state: { currentChargeInkWh: 25 },
                preferences: {
                    chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
                },
            },
        },
        {
            method: 'POST',
            url: (() => {
                const url = new URL(`${BASE_URL}/maps/orbis/routing/calculateLongDistanceEVRoute`);
                url.searchParams.set('vehicleModelId', '54B969E8-E28D-11EC-8FEA-0242AC120002');
                url.searchParams.set('currentChargeInkWh', '25');
                url.searchParams.set('minChargeAtDestinationInkWh', '5');
                url.searchParams.set('minChargeAtChargingStopsInkWh', '5');
                return url;
            })(),
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [13.492, 52.507] },
                    destination: { type: 'Point', coordinates: [8.624, 50.104] },
                },
                vehicleEngineType: 'electric',
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route based on a path to reconstruct',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [
                    [4.89066, 52.37317],
                    [4.88, 52.27317],
                    [4.87, 52.20317],
                    [4.86, 52.17317],
                    [4.49015, 52.16109],
                ],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [4.89066, 52.37317] },
                    destination: { type: 'Point', coordinates: [4.49015, 52.16109] },
                },
                legs: [
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [4.89066, 52.37317],
                                [4.88, 52.27317],
                                [4.87, 52.20317],
                                [4.86, 52.17317],
                                [4.49015, 52.16109],
                            ],
                        },
                    },
                ],
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route calculated with waypointA - routeToEmbedB - waypointC',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [0, 0],
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 },
                            ],
                        },
                    },
                } as unknown as Route,
                [2, 0],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [0, 0] },
                    destination: { type: 'Point', coordinates: [2, 0] },
                    waypoints: {
                        type: 'MultiPoint',
                        coordinates: [
                            [1, 0],
                            [1, 2],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                },
                legs: [
                    {},
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 0],
                                [1, 1],
                                [1, 2],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 2],
                                [1, 3],
                                [1, 4],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 4],
                                [1, 5],
                            ],
                        },
                    },
                    {},
                ],
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route calculated with pathToEmbedA - routeToEmbedB',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                [
                    [0, 0],
                    [0, 1],
                    [0, 2],
                ],
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 },
                            ],
                        },
                    },
                } as unknown as Route,
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [0, 0] },
                    destination: { type: 'Point', coordinates: [1, 5] },
                    waypoints: {
                        type: 'MultiPoint',
                        coordinates: [
                            [0, 2],
                            [1, 0],
                            [1, 2],
                            [1, 4],
                        ],
                    },
                },
                legs: [
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [0, 0],
                                [0, 1],
                                [0, 2],
                            ],
                        },
                    },
                    {},
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 0],
                                [1, 1],
                                [1, 2],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 2],
                                [1, 3],
                                [1, 4],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 4],
                                [1, 5],
                            ],
                        },
                    },
                ],
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
    [
        'Route calculated with routeToEmbedA - waypointB - waypointC',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: BASE_URL,
            locations: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5],
                        ],
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 },
                            ],
                        },
                    },
                } as unknown as Route,
                [2, 0],
                [3, 0],
            ],
        },
        {
            method: 'POST',
            url: V3_URL,
            data: {
                routePlanningLocations: {
                    origin: { type: 'Point', coordinates: [1, 0] },
                    destination: { type: 'Point', coordinates: [3, 0] },
                    waypoints: {
                        type: 'MultiPoint',
                        coordinates: [
                            [1, 2],
                            [1, 4],
                            [1, 5],
                            [2, 0],
                        ],
                    },
                },
                legs: [
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 0],
                                [1, 1],
                                [1, 2],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 2],
                                [1, 3],
                                [1, 4],
                            ],
                        },
                    },
                    {
                        path: {
                            type: 'LineString',
                            coordinates: [
                                [1, 4],
                                [1, 5],
                            ],
                        },
                    },
                    {},
                    {},
                ],
            },
            headers: defaultHeaders(
                'routes(summary,legs(summary,path),sections,sections.tollVignette,sections.roadShields,sections.importantRoadStretch,progressPoints)',
            ),
        },
    ],
];
