export const requestObjectsAndURLs = [
    [
        "Default A-B route",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com/",
            locations: [
                [4.89066, 52.37317],
                [4.49015, 52.16109]
            ]
        },
        "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015/json?key=GLOBAL_API_KEY"
    ],
    [
        "Default A-B-C route where B is a GeoJSON point feature",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com/",
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
        "https://api.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:52.16109,4.49015:51.92291,4.47059/json?key=GLOBAL_API_KEY"
    ],
    [
        "Default A-s-C route where s is a soft(circle) waypoint.",
        {
            apiKey: "API_KEY_X",
            commonBaseURL: "https://api-test.tomtom.com/",
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
        "https://api-test.tomtom.com/routing/1/calculateRoute/52.37317,4.89066:circle(52.16109,4.49015,20):51.92291,4.47059/json?key=API_KEY_X"
    ],
    [
        "A-B route with most optional parameters to non default values",
        {
            apiKey: "GLOBAL_API_KEY",
            commonBaseURL: "https://api.tomtom.com/",
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
            sectionTypes: "all",
            thrillingParams: {
                hilliness: "low",
                windingness: "high"
            },
            when: {
                option: "arriveBy",
                date: new Date(Date.UTC(2022, 8, 16, 15, 48, 15, 400))
            }
        },
        "https://api.tomtom.com/routing/1/calculateRoute/42.26297,3.1748:42.18211,2.48819/json?key=GLOBAL_API_KEY" +
            "&language=es-ES" +
            "&avoid=carpools&avoid=ferries&avoid=motorways&avoid=alreadyUsedRoads&avoid=tollRoads&avoid=unpavedRoads" +
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
            "&hilliness=low&windingness=high"
    ]
];
