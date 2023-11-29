import { Route } from "@anw/maps-sdk-js/core";
import { CalculateRouteParams } from "../types/calculateRouteParams";
import { FetchInput } from "../../shared/types/fetch";
import { CalculateRoutePOSTDataAPI } from "../types/apiRequestTypes";

export const sdkAndAPIRequests: [string, CalculateRouteParams, FetchInput<CalculateRoutePOSTDataAPI>][] = [
    [
        "Default A-B route",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?" +
                    "key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian&sectionType=tollRoad&sectionType=tollVignette" +
                    "&sectionType=country&sectionType=travelMode&sectionType=traffic&sectionType=carpool" +
                    "&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    [
        "Default A-B route with no sections",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            sectionTypes: []
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?" +
                    "key=GLOBAL_API_KEY&apiVersion=1"
            )
        }
    ],
    [
        "Default A-B route with specific sections",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            sectionTypes: ["vehicleRestricted", "traffic", "ferry"]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?" +
                    "key=GLOBAL_API_KEY&sectionType=travelMode&sectionType=traffic&sectionType=ferry&apiVersion=1"
            )
        }
    ],
    [
        "Default A-B-C route where B is a GeoJSON point feature",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [4.49015, 52.16109] },
                    properties: {}
                },
                [4.47059, 51.92291]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/" +
                    "52.37317,4.89066:52.16109,4.49015:51.92291,4.47059/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country&sectionType=travelMode&sectionType=traffic" +
                    "&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    [
        "Default A-s-C route where s is a soft(circle) waypoint.",
        {
            apiKey: "API_KEY_X",
            commonBaseURL: "https://api-test.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [4.49015, 52.16109] },
                    properties: { radiusMeters: 20 }
                },
                [4.47059, 51.92291]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api-test.tomtom.com/maps/orbis/routing/calculateRoute/" +
                    "52.37317,4.89066:circle(52.16109,4.49015,20):51.92291,4.47059/json?key=API_KEY_X" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country&sectionType=travelMode&sectionType=traffic" +
                    "&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    [
        "A-B route with many optional parameters set to non default values and electric vehicle params",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            language: "es-ES",
            geoInputs: [
                [3.1748, 42.26297],
                [2.48819, 42.18211]
            ],
            costModel: {
                avoid: [
                    "carpools",
                    "ferries",
                    "motorways",
                    "alreadyUsedRoads",
                    "tollRoads",
                    "unpavedRoads",
                    "borderCrossings",
                    "tunnels",
                    "carTrains",
                    "lowEmissionZones"
                ],
                considerTraffic: false,
                routeType: "thrilling"
                // thrillingParams: {
                //     hilliness: "low",
                //     windingness: "high"
                // }
            },
            computeAdditionalTravelTimeFor: "all",
            currentHeading: 45,
            // instructionsType: "tagged",
            maxAlternatives: 2
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
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/42.26297,3.1748:42.18211,2.48819/json?" +
                    "key=GLOBAL_API_KEY&language=es-ES&avoid=carpools&avoid=ferries&avoid=motorways" +
                    "&avoid=alreadyUsedRoads&avoid=tollRoads&avoid=unpavedRoads&avoid=borderCrossings" +
                    "&avoid=tunnels&avoid=carTrains&avoid=lowEmissionZones&traffic=false&routeType=thrilling" +
                    "&computeTravelTimeFor=all&vehicleHeading=45&maxAlternatives=2&sectionType=carTrain" +
                    "&sectionType=ferry&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    [
        "A-B route with combustion vehicle parameters",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ]
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
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?" +
                    "key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian&sectionType=tollRoad&sectionType=tollVignette" +
                    "&sectionType=country&sectionType=travelMode&sectionType=traffic&sectionType=carpool" +
                    "&sectionType=urban&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    [
        "non-LDEVR A-B-C route with electric vehicle parameters",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [4.89066, 52.37317],
                [4.90066, 52.27317],
                [4.49015, 52.16109]
            ]
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
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/" +
                    "52.37317,4.89066:52.27317,4.90066:52.16109,4.49015/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country&sectionType=travelMode&sectionType=traffic" +
                    "&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            )
        }
    ],
    // [
    //     "LDEV A-B Route",
    //     {
    //         apiKey: "GLOBAL_API_KEY",
    //         commonBaseURL: "https://api.tomtom.com",
    //         geoInputs: [
    //             [4.89066, 52.37317],
    //             [4.49015, 52.16109]
    //         ]
    //         vehicle: {
    //             engine: {
    //                 type: "electric",
    //                 currentChargePCT: 80,
    //                 chargingPreferences: {
    //                     minChargeAtChargingStopsPCT: 10,
    //                     minChargeAtDestinationPCT: 50
    //                 },
    //                 model: {
    //                     consumption: {
    //                         speedsToConsumptionsKWH: [
    //                             { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
    //                             { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
    //                         ],
    //                         auxiliaryPowerInkW: 1.7,
    //                         efficiency: {
    //                             acceleration: 0.66,
    //                             deceleration: 0.91,
    //                             uphill: 0.74,
    //                             downhill: 0.73
    //                         }
    //                     },
    //                     charging: {
    //                         maxChargeKWH: 85,
    //                         batteryCurve: [
    //                             { stateOfChargeInkWh: 50, maxPowerInkW: 200 },
    //                             { stateOfChargeInkWh: 70, maxPowerInkW: 100 },
    //                             { stateOfChargeInkWh: 80.0, maxPowerInkW: 40 }
    //                         ],
    //                         chargingConnectors: [
    //                             {
    //                                 currentType: "AC3",
    //                                 plugTypes: [
    //                                     "IEC_62196_Type_2_Outlet",
    //                                     "IEC_62196_Type_2_Connector_Cable_Attached",
    //                                     "Combo_to_IEC_62196_Type_2_Base"
    //                                 ],
    //                                 efficiency: 0.9,
    //                                 baseLoadInkW: 0.2,
    //                                 maxPowerInkW: 11
    //                             },
    //                             {
    //                                 currentType: "DC",
    //                                 plugTypes: [
    //                                     "IEC_62196_Type_2_Outlet",
    //                                     "IEC_62196_Type_2_Connector_Cable_Attached",
    //                                     "Combo_to_IEC_62196_Type_2_Base"
    //                                 ],
    //                                 voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
    //                                 efficiency: 0.9,
    //                                 baseLoadInkW: 0.2,
    //                                 maxPowerInkW: 150
    //                             },
    //                             {
    //                                 currentType: "DC",
    //                                 plugTypes: [
    //                                     "IEC_62196_Type_2_Outlet",
    //                                     "IEC_62196_Type_2_Connector_Cable_Attached",
    //                                     "Combo_to_IEC_62196_Type_2_Base"
    //                                 ],
    //                                 voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
    //                                 efficiency: 0.9,
    //                                 baseLoadInkW: 0.2
    //                             }
    //                         ],
    //                         chargingTimeOffsetInSec: 60
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         method: "POST",
    //         url: new URL(
    //             "https://api.tomtom.com/routing/1/calculateLongDistanceEVRoute/52.37317,4.89066:52.16109,4.49015/" +
    //                 "json?key=GLOBAL_API_KEY" +
    //                 "&accelerationEfficiency=0.66&decelerationEfficiency=0.91" +
    //                 "&uphillEfficiency=0.74&downhillEfficiency=0.73" +
    //                 "&vehicleEngineType=electric" +
    //                 "&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3" +
    //                 "&auxiliaryPowerInkW=1.7&maxChargeInkWh=85&currentChargeInkWh=68" +
    //                 "&minChargeAtDestinationInkWh=42.5&minChargeAtChargingStopsInkWh=8.5" +
    //                 "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
    //                 "&sectionType=motorway&sectionType=pedestrian" +
    //                 "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
    //                 "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool" +
    //                 "&sectionType=lowEmissionZone"
    //         ),
    //         data: {
    //             chargingParameters: {
    //                 batteryCurve: [
    //                     { stateOfChargeInkWh: 50, maxPowerInkW: 200 },
    //                     { stateOfChargeInkWh: 70, maxPowerInkW: 100 },
    //                     { stateOfChargeInkWh: 80.0, maxPowerInkW: 40 }
    //                 ],
    //                 chargingConnectors: [
    //                     {
    //                         currentType: "AC3",
    //                         plugTypes: [
    //                             "IEC_62196_Type_2_Outlet",
    //                             "IEC_62196_Type_2_Connector_Cable_Attached",
    //                             "Combo_to_IEC_62196_Type_2_Base"
    //                         ],
    //                         efficiency: 0.9,
    //                         baseLoadInkW: 0.2,
    //                         maxPowerInkW: 11
    //                     },
    //                     {
    //                         currentType: "DC",
    //                         plugTypes: [
    //                             "IEC_62196_Type_2_Outlet",
    //                             "IEC_62196_Type_2_Connector_Cable_Attached",
    //                             "Combo_to_IEC_62196_Type_2_Base"
    //                         ],
    //                         voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
    //                         efficiency: 0.9,
    //                         baseLoadInkW: 0.2,
    //                         maxPowerInkW: 150
    //                     },
    //                     {
    //                         currentType: "DC",
    //                         plugTypes: [
    //                             "IEC_62196_Type_2_Outlet",
    //                             "IEC_62196_Type_2_Connector_Cable_Attached",
    //                             "Combo_to_IEC_62196_Type_2_Base"
    //                         ],
    //                         voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
    //                         efficiency: 0.9,
    //                         baseLoadInkW: 0.2
    //                     }
    //                 ],
    //                 chargingTimeOffsetInSec: 60
    //             }
    //         }
    //     }
    // ],
    [
        "Route based on a path to reconstruct",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [
                    [4.89066, 52.37317],
                    [4.88, 52.27317],
                    [4.87, 52.20317],
                    [4.86, 52.17317],
                    [4.49015, 52.16109]
                ]
            ]
        },
        {
            method: "POST",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?" +
                    "key=GLOBAL_API_KEY&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country&sectionType=travelMode&sectionType=traffic" +
                    "&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
            ),
            data: {
                supportingPoints: [
                    { latitude: 52.37317, longitude: 4.89066 },
                    { latitude: 52.27317, longitude: 4.88 },
                    { latitude: 52.20317, longitude: 4.87 },
                    { latitude: 52.17317, longitude: 4.86 },
                    { latitude: 52.16109, longitude: 4.49015 }
                ]
            }
        }
    ],
    [
        "Route calculated with waypointA - routeToEmbedB - waypointC",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [0, 0],
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5]
                        ]
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 }
                            ]
                        }
                    }
                } as Route,
                [2, 0]
            ]
        },
        {
            method: "POST",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:0,2/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry" +
                    "&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone" +
                    "&apiVersion=1"
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
                    { latitude: 0, longitude: 2 }
                ],
                pointWaypoints: [
                    { supportingPointIndex: 1, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 3, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 5, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 6, waypointSourceType: "USER_DEFINED" }
                ]
            }
        }
    ],
    [
        "Route calculated with pathToEmbedA - routeToEmbedB",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                [
                    [0, 0],
                    [0, 1],
                    [0, 2]
                ],
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5]
                        ]
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 }
                            ]
                        }
                    }
                } as Route
            ]
        },
        {
            method: "POST",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,0:5,1/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country&sectionType=travelMode&sectionType=traffic" +
                    "&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone&apiVersion=1"
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
                    { latitude: 5, longitude: 1 }
                ],
                pointWaypoints: [
                    { supportingPointIndex: 3, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 5, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 7, waypointSourceType: "USER_DEFINED" }
                ]
            }
        }
    ],
    [
        "Route calculated with routeToEmbedA - waypointB - waypointC",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            geoInputs: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 0],
                            [1, 1],
                            [1, 2],
                            [1, 3],
                            [1, 4],
                            [1, 5]
                        ]
                    },
                    properties: {
                        sections: {
                            leg: [
                                { startPointIndex: 0, endPointIndex: 2 },
                                { startPointIndex: 2, endPointIndex: 4 },
                                { startPointIndex: 4, endPointIndex: 5 }
                            ]
                        }
                    }
                } as Route,
                [2, 0],
                [3, 0]
            ]
        },
        {
            method: "POST",
            url: new URL(
                "https://api.tomtom.com/maps/orbis/routing/calculateRoute/0,1:0,3/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry" +
                    "&sectionType=tunnel&sectionType=motorway&sectionType=pedestrian&sectionType=tollRoad" +
                    "&sectionType=tollVignette&sectionType=country" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=carpool&sectionType=urban" +
                    "&sectionType=unpaved&sectionType=lowEmissionZone" +
                    "&apiVersion=1"
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
                    { latitude: 0, longitude: 3 }
                ],
                pointWaypoints: [
                    { supportingPointIndex: 2, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 4, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 5, waypointSourceType: "USER_DEFINED" },
                    { supportingPointIndex: 6, waypointSourceType: "USER_DEFINED" }
                ]
            }
        }
    ]
];
