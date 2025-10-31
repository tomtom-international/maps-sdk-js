import type { Route } from '@tomtom-org/maps-sdk/core';
import type { FetchInput } from '../../shared';
import type { CalculateRoutePOSTDataAPI } from '../types/apiRequestTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';

export const sdkAndAPIRequests: [string, CalculateRouteParams, FetchInput<CalculateRoutePOSTDataAPI>][] = [
    [
        'Default A-B route',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel' +
                    '&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic&sectionType=carpool' +
                    '&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
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
                    'apiVersion=2&key=GLOBAL_API_KEY&language=en-GB',
            ),
        },
    ],
    [
        'Default A-B route with specific sections',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            locations: [
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
                    'apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&sectionType=travelMode&sectionType=traffic&sectionType=ferry' +
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
            locations: [
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
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
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
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
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
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
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
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
                    '&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'A-B route with simple vehicle parameters (weight dimensions only, no engineType)',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 2,
            commonBaseURL: 'https://api.tomtom.com',
            locations: [
                [52.52, 13.405],
                [48.8566, 2.3522],
            ],
            vehicle: { model: { dimensions: { weightKG: 2500 } } },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/13.405,52.52:2.3522,48.8566/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&vehicleWeight=2500' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
                // TODO not supported in Orbis
                // thrillingParams: {
                //     hilliness: "low",
                //     windingness: "high"
                // }
            },
            computeAdditionalTravelTimeFor: 'all',
            maxAlternatives: 2,
            // TODO not supported in Orbis
            // routeRepresentation: "summaryOnly",
            vehicle: {
                engineType: 'electric',
                model: {
                    dimensions: {
                        lengthMeters: 20,
                        widthMeters: 5,
                        heightMeters: 4,
                        weightKG: 3500,
                        axleWeightKG: 500,
                    },
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
                restrictions: {
                    maxSpeedKMH: 60,
                    loadTypes: ['otherHazmatExplosive', 'otherHazmatHarmfulToWater'],
                    adrCode: 'B',
                    commercial: true,
                },
            },
            when: { option: 'arriveBy', date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400)) },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/42.26297,3.1748:42.18211,2.48819/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&language=es-ES&avoid=carpools&avoid=ferries&avoid=motorways' +
                    '&avoid=alreadyUsedRoads&avoid=tollRoads&avoid=unpavedRoads&avoid=borderCrossings' +
                    '&avoid=tunnels&avoid=carTrains&avoid=lowEmissionZones&traffic=historical&arriveAt=2022-09-16T15%3A48%3A15.400Z&routeType=thrilling' +
                    '&vehicleEngineType=electric&vehicleLength=20&vehicleHeight=4&vehicleWidth=5&vehicleWeight=3500&vehicleAxleWeight=500' +
                    '&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3&auxiliaryPowerInkW=1.7&consumptionInkWhPerkmAltitudeGain=7' +
                    '&recuperationInkWhPerkmAltitudeLoss=3.8&maxChargeInkWh=85&vehicleHeading=45&currentChargeInkWh=42.5' +
                    '&vehicleLoadType=otherHazmatExplosive&vehicleLoadType=otherHazmatHarmfulToWater&vehicleAdrTunnelRestrictionCode=B' +
                    '&vehicleCommercial=true&vehicleMaxSpeed=60&computeTravelTimeFor=all&maxAlternatives=2&sectionType=carTrain' +
                    '&sectionType=ferry&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109],
            ],
            vehicle: {
                engineType: 'combustion',
                model: {
                    dimensions: { weightKG: 1500 },
                    engine: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 11.5 },
                            ],
                            auxiliaryPowerInLitersPerHour: 0.2,
                            fuelEnergyDensityInMJoulesPerLiter: 34.2,
                            efficiency: {
                                acceleration: 0.33,
                                deceleration: 0.83,
                                uphill: 0.27,
                                downhill: 0.51,
                            },
                        },
                    },
                },
                state: { currentFuelInLiters: 55 },
            },
            when: { option: 'departAt', date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400)) },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json' +
                    '?apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&departAt=2022-09-16T15%3A48%3A15.400Z&vehicleWeight=1500' +
                    '&accelerationEfficiency=0.33&decelerationEfficiency=0.83&uphillEfficiency=0.27' +
                    '&downhillEfficiency=0.51&constantSpeedConsumptionInLitersPerHundredkm=50%2C6.3%3A130%2C11.5' +
                    '&auxiliaryPowerInLitersPerHour=0.2&fuelEnergyDensityInMJoulesPerLiter=34.2&currentFuelInLiters=55' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            locations: [
                [4.89066, 52.37317],
                [4.90066, 52.27317],
                [4.49015, 52.16109],
            ],
            costModel: { traffic: 'live' },
            vehicle: {
                engineType: 'electric',
                model: {
                    dimensions: { weightKG: 3500 },
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInkW: 1.7,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                        charging: { maxChargeKWH: 85 },
                    },
                },
                state: { currentChargePCT: 80 },
                restrictions: { maxSpeedKMH: 60 },
            },
        },
        {
            method: 'GET',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.27317,4.90066:52.16109,4.49015/json' +
                    '?apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&traffic=live&vehicleEngineType=electric&vehicleWeight=3500' +
                    '&accelerationEfficiency=0.66&decelerationEfficiency=0.91&uphillEfficiency=0.74' +
                    '&downhillEfficiency=0.73&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3' +
                    '&auxiliaryPowerInkW=1.7&maxChargeInkWh=85&currentChargeInkWh=68&vehicleMaxSpeed=60' +
                    '&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone&sectionType=speedLimit' +
                    '&sectionType=roadShields&sectionType=importantRoadStretch&extendedRouteRepresentation=distance&extendedRouteRepresentation=travelTime',
            ),
        },
    ],
    [
        'LDEVR A-B Route with vehicle model ID',
        {
            apiKey: 'GLOBAL_API_KEY',
            apiVersion: 23,
            commonBaseURL: 'https://api.tomtom.com',
            locations: [
                [13.492, 52.507],
                [8.624, 50.104],
            ],
            vehicle: {
                engineType: 'electric',
                model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
                state: { currentChargeInkWh: 25 },
                preferences: {
                    chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
                },
            },
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateLongDistanceEVRoute/52.507,13.492:50.104,8.624/' +
                    'json?apiVersion=23&key=GLOBAL_API_KEY&language=en-GB&vehicleEngineType=electric' +
                    '&vehicleModelId=54B969E8-E28D-11EC-8FEA-0242AC120002' +
                    '&currentChargeInkWh=25&minChargeAtDestinationInkWh=5&minChargeAtChargingStopsInkWh=5' +
                    '&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?' +
                    'apiVersion=2&key=GLOBAL_API_KEY&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel' +
                    '&sectionType=motorway&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
                } as Route,
                [2, 0],
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:0,2/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
                } as Route,
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:5,1/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway' +
                    '&sectionType=pedestrian&sectionType=toll&sectionType=tollVignette' +
                    '&sectionType=country&sectionType=travelMode&sectionType=traffic' +
                    '&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
                } as Route,
                [2, 0],
                [3, 0],
            ],
        },
        {
            method: 'POST',
            url: new URL(
                'https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,1:0,3/json?apiVersion=2&key=GLOBAL_API_KEY' +
                    '&language=en-GB&sectionType=carTrain&sectionType=ferry' +
                    '&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian' +
                    '&sectionType=toll&sectionType=tollVignette&sectionType=country' +
                    '&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban' +
                    '&sectionType=unpaved&sectionType=lowEmissionZone' +
                    '&sectionType=speedLimit&sectionType=roadShields&sectionType=importantRoadStretch' +
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
