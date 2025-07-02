import type { Route } from '@anw/maps-sdk-js/core';
import type { CalculateRouteParams } from '../types/calculateRouteParams';
import type { FetchInput } from '../../shared';
import type { CalculateRoutePOSTDataAPI } from '../types/apiRequestTypes';

export const sdkAndAPIRequests: [string, CalculateRouteParams, FetchInput<CalculateRoutePOSTDataAPI>][] = [
    [
        'Default A-B route',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel' +
                    '&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic&sectionType=carpool' +
                    '&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'Default A-B route with no sections',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: [],
            extendedRouteRepresentations: [],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY',
            ),
        },
    ],
    [
        'Default A-B route with specific sections',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            sectionTypes: ['vehicleRestricted', 'traffic', 'ferry'],
            extendedRouteRepresentations: ['travelTime'],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&sectionType=travelMode&sectionType=traffic&sectionType=ferry' +
                    '&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'Default A-B-C route where B is a GeoJSON point feature',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: {},
                },
                [4.47059, 51.92291],
            ],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/' +
                    '52.37317,4.89066:52.16109,4.49015:51.92291,4.47059/json?apiVersion=3&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'Default A-B route where B is a GeoJSON point feature with entry points',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: { entryPoints: [{ type: 'main', position: [5, 53] }] },
                },
            ],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/' +
                    '52.37317,4.89066:53,5/json?apiVersion=3&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        "Default A-B route where B is a GeoJSON point feature with entry points but we'll ignore them",
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 3,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: { entryPoints: [{ type: 'main', position: [5, 53] }] },
                },
            ],
            useEntryPoints: 'ignore',
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/' +
                    '52.37317,4.89066:52.16109,4.49015/json?apiVersion=3&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'Default A-s-C route where s is a soft(circle) waypoint.',
        {
            apiKey: 'API_KEY_X',
            apiVersion: 2,
            commonBaseURL: 'https://api-test.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.49015, 52.16109] },
                    properties: { radiusMeters: 20 },
                },
                [4.47059, 51.92291],
            ],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api-test.tomtom.com/maps/orbis/routing/calculateRoute/' +
                    '52.37317,4.89066:circle(52.16109,4.49015,20):51.92291,4.47059/json?apiVersion=2&key=API_KEY_X' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'A-B route with many optional parameters set to non default values and electric vehicle params',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            language: 'es-ES',
            geoInputs: [
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
                // TODO not supported in Orbis
                // thrillingParams: {
                //     hilliness: "low",
                //     windingness: "high"
                // }
            },
            computeAdditionalTravelTimeFor: 'all',
            vehicleHeading: 45,
            maxAlternatives: 2,
            // TODO not supported in Orbis
            // routeRepresentation: "summaryOnly",
            // vehicle: {
            //     commercial: true,
            //     dimensions: {
            //         lengthMeters: 20,
            //         widthMeters: 5,
            //         heightMeters: 4,
            //         weightKG: 3500,
            //         axleWeightKG: 500
            //     },
            //     maxSpeedKMH: 60,
            //     loadTypes: ["otherHazmatExplosive", "otherHazmatHarmfulToWater"],
            //     adrCode: "B",
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 50,
            //         model: {
            //             charging: { maxChargeKWH: 85 },
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ],
            //                 auxiliaryPowerInkW: 1.7,
            //                 consumptionInKWHPerKMAltitudeGain: 7,
            //                 recuperationInKWHPerKMAltitudeLoss: 3.8
            //             }
            //         }
            //     }
            // },
            // when: {
            //     option: "arriveBy",
            //     date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
            // }
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/42.26297,3.1748:42.18211,2.48819/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&avoid=carpools&avoid=ferries&avoid=motorways' +
                    '&avoid=alreadyUsedRoads&avoid=tollRoads&avoid=unpavedRoads&avoid=borderCrossings' +
                    '&avoid=tunnels&avoid=carTrains&avoid=lowEmissionZones&traffic=historical&routeType=thrilling' +
                    '&computeTravelTimeFor=all&vehicleHeading=45&maxAlternatives=2&sectionType=carTrain' +
                    '&sectionType=ferry&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'A-B route with combustion vehicle parameters',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            // TODO not supported in Orbis
            // vehicle: {
            //     dimensions: { weightKG: 1500 },
            //     engine: {
            //         type: "combustion",
            //         currentFuelInLiters: 55,
            //         model: {
            //             consumption: {
            //                 speedsToConsumptionsLiters: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 11.5 }
            //                 ],
            //                 auxiliaryPowerInLitersPerHour: 0.2,
            //                 fuelEnergyDensityInMJoulesPerLiter: 34.2,
            //                 efficiency: {
            //                     acceleration: 0.33,
            //                     deceleration: 0.83,
            //                     uphill: 0.27,
            //                     downhill: 0.51
            //                 }
            //             }
            //         }
            //     }
            // },
            // when: {
            //     option: "departAt",
            //     date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
            // }
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel' +
                    '&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic&sectionType=carpool' +
                    '&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'non-LDEVR A-B-C route with electric vehicle parameters',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [4.89066, 52.37317],
                [4.90066, 52.27317],
                [4.49015, 52.16109],
            ],
            costModel: { traffic: 'live' },
            // TODO not supported in Orbis
            // vehicle: {
            //     dimensions: { weightKG: 3500 },
            //     maxSpeedKMH: 60,
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 80,
            //         model: {
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ],
            //                 auxiliaryPowerInkW: 1.7,
            //                 efficiency: {
            //                     acceleration: 0.66,
            //                     deceleration: 0.91,
            //                     uphill: 0.74,
            //                     downhill: 0.73
            //                 }
            //             },
            //             charging: {
            //                 maxChargeKWH: 85
            //             }
            //         }
            //     }
            // }
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/' +
                    '52.37317,4.89066:52.27317,4.90066:52.16109,4.49015/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&traffic=live' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'LDEV A-B Route',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
                [13.492, 52.507],
                [8.624, 50.104],
            ],
            commonEVRoutingParams: {
                currentChargeInkWh: 20,
                minChargeAtDestinationInkWh: 4,
                minChargeAtChargingStopsInkWh: 4,
                vehicleModelId: '54B969E8-E28D-11EC-8FEA-0242AC120002',
            },
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateLongDistanceEVRoute/52.507,13.492:50.104,8.624/' +
                    'json?apiVersion=2&key=GLOBAL_API_KEY&vehicleEngineType=electric&currentChargeInkWh=20' +
                    '&minChargeAtDestinationInkWh=4&minChargeAtChargingStopsInkWh=4' +
                    '&vehicleModelId=54B969E8-E28D-11EC-8FEA-0242AC120002&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
            data: {},
        },
    ],
    [
        'Route based on a path to reconstruct',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
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
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel' +
                    '&sectionType=motorway&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
            data: {
                supportingPoints: [
                    { latitude: 52.37317, longitude: 4.89066 },
                    { latitude: 52.27317, longitude: 4.88 },
                    { latitude: 52.20317, longitude: 4.87 },
                    { latitude: 52.17317, longitude: 4.86 },
                    { latitude: 52.16109, longitude: 4.49015 },
                ],
            },
        },
    ],
    [
        'Route calculated with waypointA - routeToEmbedB - waypointC',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
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
                } as Route,
                [2, 0],
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:0,2/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
            data: {
                supportingPoints: [
                    { latitude: 0, longitude: 0 },
                    { latitude: 0, longitude: 1 },
                    { latitude: 1, longitude: 1 },
                    { latitude: 2, longitude: 1 },
                    { latitude: 3, longitude: 1 },
                    { latitude: 4, longitude: 1 },
                    { latitude: 5, longitude: 1 },
                    { latitude: 0, longitude: 2 },
                ],
                pointWaypoints: [
                    { supportingPointIndex: 1, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 3, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 5, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 6, waypointSourceType: 'USER_DEFINED' },
                ],
            },
        },
    ],
    [
        'Route calculated with pathToEmbedA - routeToEmbedB',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
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
                } as Route,
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:5,1/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
            data: {
                supportingPoints: [
                    { latitude: 0, longitude: 0 },
                    { latitude: 1, longitude: 0 },
                    { latitude: 2, longitude: 0 },
                    { latitude: 0, longitude: 1 },
                    { latitude: 1, longitude: 1 },
                    { latitude: 2, longitude: 1 },
                    { latitude: 3, longitude: 1 },
                    { latitude: 4, longitude: 1 },
                    { latitude: 5, longitude: 1 },
                ],
                pointWaypoints: [
                    { supportingPointIndex: 3, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 5, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 7, waypointSourceType: 'USER_DEFINED' },
                ],
            },
        },
    ],
    [
        'Route calculated with routeToEmbedA - waypointB - waypointC',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            geoInputs: [
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
                } as Route,
                [2, 0],
                [3, 0],
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,1:0,3/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
            data: {
                supportingPoints: [
                    { latitude: 0, longitude: 1 },
                    { latitude: 1, longitude: 1 },
                    { latitude: 2, longitude: 1 },
                    { latitude: 3, longitude: 1 },
                    { latitude: 4, longitude: 1 },
                    { latitude: 5, longitude: 1 },
                    { latitude: 0, longitude: 2 },
                    { latitude: 0, longitude: 3 },
                ],
                pointWaypoints: [
                    { supportingPointIndex: 2, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 4, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 5, waypointSourceType: 'USER_DEFINED' },
                    { supportingPointIndex: 6, waypointSourceType: 'USER_DEFINED' },
                ],
            },
        },
    ],
];
