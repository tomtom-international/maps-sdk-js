export const requestObjectsAndURLs = [
    [
        "Default A-B route",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
                    "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool"
            )
        }
    ],
    [
        "Default A-B route with no sections",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            sectionTypes: []
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY"
            )
        }
    ],
    [
        "Default A-B route with specific sections",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            sectionTypes: ["vehicleRestricted", "traffic", "ferry"]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=ferry"
            )
        }
    ],
    [
        "Default A-B-C route where B is a GeoJSON point feature",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.49015, 52.16109]
                    }
                },
                [4.47059, 51.92291]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015:51.92291,4.47059/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
                    "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool"
            )
        }
    ],
    [
        "Default A-s-C route where s is a soft(circle) waypoint.",
        {
            apiKey: "API_KEY_X",
            commonBaseURL: "https://api-test.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.49015, 52.16109]
                    },
                    properties: {
                        radiusMeters: 20
                    }
                },
                [4.47059, 51.92291]
            ]
        },
        {
            method: "GET",
            url: new URL(
                "https://api-test.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:circle(52.16109,4.49015,20):51.92291,4.47059/json?key=API_KEY_X" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
                    "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool"
            )
        }
    ],
    [
        "A-B route with many optional parameters set to non default values and electric vehicle params",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            language: "es-ES",
            locations: [
                [3.1748, 42.26297],
                [2.48819, 42.18211]
            ],
            avoid: ["carpools", "ferries", "motorways", "alreadyUsedRoads", "tollRoads", "unpavedRoads"],
            computeAdditionalTravelTimeFor: "all",
            considerTraffic: false,
            currentHeading: 45,
            instructionsType: "tagged",
            maxAlternatives: 2,
            routeRepresentation: "summaryOnly",
            routeType: "thrilling",
            thrillingParams: {
                hilliness: "low",
                windingness: "high"
            },
            vehicle: {
                commercial: true,
                dimensions: {
                    lengthMeters: 20,
                    widthMeters: 5,
                    heightMeters: 4,
                    weightKG: 3500,
                    axleWeightKG: 500
                },
                maxSpeedKMH: 60,
                loadTypes: ["otherHazmatExplosive", "otherHazmatHarmfulToWater"],
                adrCode: "B",
                consumption: {
                    engineType: "electric",
                    speedsToConsumptionsKWH: [
                        { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                        { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
                    ],
                    auxiliaryPowerInkW: 1.7,
                    currentChargeKWH: 43,
                    maxChargeKWH: 85,
                    consumptionInKWHPerKMAltitudeGain: 7,
                    recuperationInKWHPerKMAltitudeLoss: 3.8
                }
            },
            when: {
                option: "arriveBy",
                date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
            }
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/42.26297,3.1748:42.18211,2.48819/json?key=GLOBAL_API_KEY" +
                    "&language=es-ES" +
                    "&avoid=carpools&avoid=ferries&avoid=motorways" +
                    "&avoid=alreadyUsedRoads&avoid=tollRoads&avoid=unpavedRoads" +
                    "&computeTravelTimeFor=all" +
                    "&traffic=false" +
                    "&vehicleHeading=45" +
                    "&arriveAt=2022-09-16T15%3A48%3A15.400Z" +
                    "&instructionsType=tagged" +
                    "&maxAlternatives=2" +
                    "&routeRepresentation=summaryOnly" +
                    "&routeType=thrilling" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel&sectionType=motorway" +
                    "&sectionType=pedestrian&sectionType=tollRoad&sectionType=tollVignette&sectionType=country" +
                    "&sectionType=travelMode&sectionType=traffic&sectionType=urban&sectionType=unpaved" +
                    "&sectionType=carpool&hilliness=low&windingness=high" +
                    "&vehicleEngineType=electric" +
                    "&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3" +
                    "&auxiliaryPowerInkW=1.7" +
                    "&consumptionInkWhPerkmAltitudeGain=7&recuperationInkWhPerkmAltitudeLoss=3.8" +
                    "&maxChargeInkWh=85&currentChargeInkWh=43" +
                    "&vehicleLength=20&vehicleHeight=4&vehicleWidth=5&vehicleWeight=3500&vehicleAxleWeight=500" +
                    "&vehicleLoadType=otherHazmatExplosive&vehicleLoadType=otherHazmatHarmfulToWater" +
                    "&vehicleAdrTunnelRestrictionCode=B&vehicleCommercial=true&vehicleMaxSpeed=60"
            )
        }
    ],
    [
        "A-B route with combustion vehicle parameters",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            vehicle: {
                dimensions: {
                    weightKG: 1500
                },
                consumption: {
                    speedsToConsumptionsLiters: [
                        { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                        { speedKMH: 130, consumptionUnitsPer100KM: 11.5 }
                    ],
                    auxiliaryPowerInLitersPerHour: 0.2,
                    currentFuelLiters: 55,
                    fuelEnergyDensityInMJoulesPerLiter: 34.2,
                    efficiency: {
                        acceleration: 0.33,
                        deceleration: 0.83,
                        uphill: 0.27,
                        downhill: 0.51
                    }
                }
            },
            when: {
                option: "departAt",
                date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
            }
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY" +
                    "&departAt=2022-09-16T15%3A48%3A15.400Z" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
                    "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool" +
                    "&accelerationEfficiency=0.33&decelerationEfficiency=0.83" +
                    "&uphillEfficiency=0.27&downhillEfficiency=0.51" +
                    "&constantSpeedConsumptionInLitersPerHundredkm=50%2C6.3%3A130%2C11.5" +
                    "&auxiliaryPowerInLitersPerHour=0.2" +
                    "&fuelEnergyDensityInMJoulesPerLiter=34.2" +
                    "&currentFuelInLiters=55" +
                    "&vehicleWeight=1500"
            )
        }
    ],
    [
        "A-B route with electric vehicle parameters",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ],
            vehicle: {
                dimensions: {
                    weightKG: 3500
                },
                maxSpeedKMH: 60,
                consumption: {
                    engineType: "electric",
                    speedsToConsumptionsKWH: [
                        { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                        { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
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
            }
        },
        {
            method: "GET",
            url: new URL(
                "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY" +
                    "&sectionType=carTrain&sectionType=ferry&sectionType=tunnel" +
                    "&sectionType=motorway&sectionType=pedestrian" +
                    "&sectionType=tollRoad&sectionType=tollVignette&sectionType=country&sectionType=travelMode" +
                    "&sectionType=traffic&sectionType=urban&sectionType=unpaved&sectionType=carpool" +
                    "&vehicleEngineType=electric" +
                    "&accelerationEfficiency=0.66&decelerationEfficiency=0.91" +
                    "&uphillEfficiency=0.74&downhillEfficiency=0.73" +
                    "&constantSpeedConsumptionInkWhPerHundredkm=50%2C8.2%3A130%2C21.3" +
                    "&auxiliaryPowerInkW=1.7&maxChargeInkWh=85&currentChargeInkWh=43" +
                    "&vehicleWeight=3500&vehicleMaxSpeed=60"
            )
        }
    ]
];
