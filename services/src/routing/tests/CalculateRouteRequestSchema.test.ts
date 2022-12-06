import { calculateRoute } from "../CalculateRoute";

describe("Calculate route request schema validation", () => {
    test("it should fail when latitude & longitude are out of range", async () => {
        await expect(
            calculateRoute({
                locations: [
                    [200, 180],
                    [-200, -180]
                ]
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "too_big",
                    maximum: 180,
                    message: "Number must be less than or equal to 180",
                    path: ["locations", 0, 0],
                    type: "number"
                },
                {
                    code: "too_big",
                    maximum: 90,
                    message: "Number must be less than or equal to 90",
                    path: ["locations", 0, 1],
                    type: "number"
                },
                {
                    code: "too_small",
                    minimum: -180,
                    message: "Number must be greater than or equal to -180",
                    path: ["locations", 1, 0],
                    type: "number"
                },
                {
                    code: "too_small",
                    minimum: -90,
                    message: "Number must be greater than or equal to -90",
                    path: ["locations", 1, 1],
                    type: "number"
                }
            ]
        });
    });

    test("it should fail when format of location is incorrect - example 1", async () => {
        await expect(
            calculateRoute({
                // @ts-ignore
                locations: "4.89066,52.37317:4.49015,52.16109"
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when format of location is incorrect - example 2", async () => {
        await expect(
            calculateRoute({
                // @ts-ignore
                locations: [[4.89066, 52.37317]]
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "too_small",
                    message: "Array must contain at least 2 element(s)"
                }
            ]
        });
    });

    test("it should fail when location param is missing", async () => {
        await expect(
            //@ts-ignore
            calculateRoute({
                sectionTypes: ["traffic"]
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    path: ["locations"],
                    message: "Required"
                }
            ]
        });
    });

    test("it should fail when format of optional params are incorrect", async () => {
        await expect(
            calculateRoute({
                locations: [
                    [4.89066, 52.37317],
                    [4.4906, 51.37317]
                ],
                //@ts-ignore
                avoid: "tollRoads",
                //@ts-ignore
                computeAdditionalTravelTimeFor: "first",
                //@ts-ignore
                considerTraffic: "true",
                //@ts-ignore
                currentHeading: 360,
                //@ts-ignore
                instructionsType: "Coded",
                //@ts-ignore
                maxAlternatives: 6,
                //@ts-ignore
                routeRepresentation: "summary",
                thrillingParams: {
                    hilliness: "low",
                    //@ts-ignore
                    windingness: "medium"
                },
                //@ts-ignore
                travelMode: 2,
                when: {
                    //@ts-ignore
                    option: "arriveAt",
                    date: new Date()
                },
                //@ts-ignore
                sectionTypes: ["tunnel", "motorways"]
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    message: "Expected array, received string",
                    path: ["avoid"],
                    received: "string"
                },
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'none' | 'all', received 'first'",
                    options: ["none", "all"],
                    path: ["computeAdditionalTravelTimeFor"],
                    received: "first"
                },
                {
                    code: "invalid_type",
                    expected: "boolean",
                    message: "Expected boolean, received string",
                    path: ["considerTraffic"],
                    received: "string"
                },
                {
                    code: "too_big",
                    inclusive: true,
                    maximum: 359.5,
                    message: "Number must be less than or equal to 359.5",
                    path: ["currentHeading"],
                    type: "number"
                },
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'coded' | 'text' | 'tagged', received 'Coded'",
                    options: ["coded", "text", "tagged"],
                    path: ["instructionsType"],
                    received: "Coded"
                },
                {
                    code: "too_big",
                    inclusive: true,
                    maximum: 5,
                    message: "Number must be less than or equal to 5",
                    path: ["maxAlternatives"],
                    type: "number"
                },
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'polyline' | 'summaryOnly', received 'summary'",
                    options: ["polyline", "summaryOnly"],
                    path: ["routeRepresentation"],
                    received: "summary"
                },
                {
                    code: "invalid_enum_value",
                    message:
                        "Invalid enum value. Expected 'carTrain' | 'ferry' | 'tunnel' | 'motorway' | 'pedestrian' | " +
                        "'tollRoad' | 'tollVignette' | 'country' | 'vehicleRestricted' | 'traffic' | 'urban' | " +
                        "'unpaved' | 'carpool', received 'motorways'",
                    options: [
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
                    path: ["sectionTypes", 1],
                    received: "motorways"
                },
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'low' | 'normal' | 'high', received 'medium'",
                    options: ["low", "normal", "high"],
                    path: ["thrillingParams", "windingness"],
                    received: "medium"
                },
                {
                    code: "invalid_type",
                    expected: "string",
                    message: "Expected string, received number",
                    path: ["travelMode"],
                    received: "number"
                },
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'departAt' | 'arriveBy', received 'arriveAt'",
                    options: ["departAt", "arriveBy"],
                    path: ["when", "option"],
                    received: "arriveAt"
                }
            ]
        });
    });
});
