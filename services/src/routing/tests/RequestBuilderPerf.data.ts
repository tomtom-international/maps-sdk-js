export const routeRequestParams = {
    apiKey: "GLOBAL_API_KEY",
    commonBaseURL: "https://api.tomtom.com",
    locations: [
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
        [8.773598402165248, 51.943411524054625],
        [7.803427298578839, 51.46516246033531],
        [6.612762762356908, 50.91238848481575],
        [6.105627867299688, 50.591536662111054],
        [5.439706253476629, 50.2545121701294],
        [4.793691943130028, 49.53711561267065],
        [4.068253473632353, 49.288670367426704],
        [2.35085, 48.85689],
        [7.0537496276178615, 49.42250920768271],
        [5.532344942445349, 49.24289951141705],
        [6.579688747462427, 50.113199521644475],
        [7.483711821253564, 50.33889967725196],
        [8.358932406679145, 50.01384578463174],
        [8.598546601066346, 50.308663759520186],
        [9.339257807829398, 50.87736896126995],
        [9.67075842933545, 50.91440430303814],
        [10.504471848338795, 51.10661374264785],
        [10.559595206500319, 51.80728465885474],
        [11.044680758292344, 51.32759034535556],
        [12.02587653351398, 51.75271848291251],
        [11.298248205823, 51.609168151709866],
        [11.640013026405398, 51.629703208547966],
        [12.202271279614138, 51.997746920777786],
        [13.41144, 52.52343]
    ],
    avoid: ["carpools", "ferries", "unpavedRoads", "tollRoads"],
    considerTraffic: true,
    currentHeading: 180,
    instructionsType: "text",
    maxAlternatives: 3,
    routeRepresentation: "summaryOnly",
    routeType: "fastest",
    sectionTypes: [
        "carTrain",
        "ferry",
        "tunnel",
        "motorway",
        "pedestrian",
        "tollRoad",
        "tollVignette",
        "country",
        "vehicleRestricted",
        "traffic",
        "urban",
        "unpaved",
        "carpool"
    ],
    travelMode: "car",
    vehicle: {
        dimensions: {
            weightKG: 3500
        },
        consumption: {
            engineType: "electric",
            speedsToConsumptionsKWH: [
                {
                    speedKMH: 50,
                    consumptionUnitsPer100KM: 8.2
                },
                {
                    speedKMH: 130,
                    consumptionUnitsPer100KM: 21.3
                }
            ],
            auxiliaryPowerInkW: 1.7,
            currentChargeKWH: 43,
            maxChargeKWH: 85,
            efficiency: {
                acceleration: 0.66,
                deceleration: 0.91,
                uphill: 0.74,
                downhill: 0.73
            }
        }
    },
    when: {
        option: "arriveBy",
        date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
    }
};
