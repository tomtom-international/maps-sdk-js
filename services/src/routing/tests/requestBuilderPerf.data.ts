import { CalculateRouteParams } from "../types/calculateRouteParams";

export const routeRequestParams: CalculateRouteParams = {
    apiKey: "APIKEY",
    commonBaseURL: "https://api.tomtom.com",
    geoInputs: [
        [13.41144, 52.52343],
        [12.261188845147501, 52.30496106764048],
        [11.339420206492264, 52.314014331366934],
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [10.874140452495482, 52.378404663191446]
            },
            properties: {
                radiusMeters: 10391
            }
        },
        [10.277207424270273, 52.414625638793154],
        [9.427315041133511, 52.29791537992651],
        [9.286141938770697, 52.26203759234198],
        [10.559595206500319, 51.80728465885474],
        [11.044680758292344, 51.32759034535556],
        [12.02587653351398, 51.75271848291251],
        [11.298248205823, 51.609168151709866],
        [11.640013026405398, 51.629703208547966],
        [12.202271279614138, 51.997746920777786],
        [13.41144, 52.52343]
    ],
    costModel: {
        avoid: ["carpools", "ferries", "unpavedRoads", "tollRoads"],
        considerTraffic: true,
        routeType: "fastest"
    },
    currentHeading: 180,
    // instructionsType: "text",
    maxAlternatives: 3,
    // routeRepresentation: "summaryOnly",

    sectionTypes: [
        "carTrain",
        "ferry",
        "tunnel",
        "motorway",
        "pedestrian",
        "tollRoad",
        "tollVignette",
        "country",
        // "vehicleRestricted",
        "traffic",
        "urban",
        "unpaved",
        "carpool"
    ],
    travelMode: "car"
    // vehicle: {
    //     dimensions: {
    //         weightKG: 3500
    //     },
    //     engine: {
    //         type: "electric",
    //         currentChargePCT: 80,
    //         model: {
    //             charging: {
    //                 maxChargeKWH: 85
    //             },
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
    //             }
    //         }
    //     }
    // },
    // when: {
    //     option: "arriveBy",
    //     date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
    // }
};

export const shortRouteRequestParams: CalculateRouteParams = {
    apiKey: "APIKEY",
    commonBaseURL: "https://api.tomtom.com",
    geoInputs: [
        [4.76364, 52.31064],
        [4.31276, 52.00427],
        {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [4.70512, 51.82878]
            },
            properties: {
                radiusMeters: 20
            }
        },
        [3.72227, 51.05382]
    ],
    costModel: {
        avoid: ["tollRoads"],
        considerTraffic: true,
        routeType: "fastest"
    },
    // instructionsType: "text",
    maxAlternatives: 3,
    // routeRepresentation: "summaryOnly",
    sectionTypes: [
        "carTrain",
        "ferry",
        "tunnel",
        "motorway",
        "pedestrian",
        "tollRoad",
        "tollVignette",
        "country",
        // "vehicleRestricted",
        "traffic",
        "urban",
        "unpaved",
        "carpool"
    ],
    travelMode: "car"
    // when: {
    //     option: "arriveBy",
    //     date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
    // }
};
