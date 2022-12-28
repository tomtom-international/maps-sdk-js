import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { validateRequestSchema } from "../../shared/Validation";
import { calculateRouteRequestSchema } from "../CalculateRouteRequestSchema";
import { routeRequestParams } from "./RequestBuilderPerf.data";
import { CalculateRouteParams } from "../types/CalculateRouteParams";

describe("Calculate route request schema validation", () => {
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";

    test("it should fail when latitude & longitude are out of range", () => {
        // @ts-ignore
        const validationResult = () =>
            validateRequestSchema(
                {
                    locations: [
                        [200, 180],
                        [-200, -180]
                    ],
                    apiKey,
                    commonBaseURL
                },
                calculateRouteRequestSchema
            );
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "too_big",
                        maximum: 180,
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 180",
                        path: ["locations", 0, 0],
                        type: "number"
                    },
                    {
                        code: "too_big",
                        maximum: 90,
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 90",
                        path: ["locations", 0, 1],
                        type: "number"
                    },
                    {
                        code: "too_small",
                        minimum: -180,
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to -180",
                        path: ["locations", 1, 0],
                        type: "number"
                    },
                    {
                        code: "too_small",
                        minimum: -90,
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to -90",
                        path: ["locations", 1, 1],
                        type: "number"
                    }
                ]
            })
        );
    });

    test("it should fail when format of location is incorrect - example 1", () => {
        const validationResult = () =>
            validateRequestSchema(
                {
                    locations: "4.89066,52.37317:4.49015,52.16109",
                    apiKey,
                    commonBaseURL
                },
                calculateRouteRequestSchema
            );
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["locations"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when format of location is incorrect - example 2", () => {
        const validationResult = () =>
            validateRequestSchema(
                { locations: [[4.89066, 52.37317]], apiKey, commonBaseURL },
                calculateRouteRequestSchema
            );
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "too_small",
                        minimum: 2,
                        type: "array",
                        inclusive: true,
                        exact: false,
                        message: "Array must contain at least 2 element(s)",
                        path: ["locations"]
                    }
                ]
            })
        );
    });

    test("it should fail when location param is missing", () => {
        const validationResult = () =>
            validateRequestSchema({ sectionTypes: ["traffic"], apiKey, commonBaseURL }, calculateRouteRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "undefined",
                        path: ["locations"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when format of optional params are incorrect", () => {
        const validationResult = () =>
            validateRequestSchema(
                {
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
                    sectionTypes: ["tunnel", "motorways"],
                    apiKey,
                    commonBaseURL
                },
                calculateRouteRequestSchema
            );
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["avoid"],
                        message: "Expected array, received string"
                    },
                    {
                        received: "first",
                        code: "invalid_enum_value",
                        options: ["none", "all"],
                        path: ["computeAdditionalTravelTimeFor"],
                        message: "Invalid enum value. Expected 'none' | 'all', received 'first'"
                    },
                    {
                        code: "invalid_type",
                        expected: "boolean",
                        received: "string",
                        path: ["considerTraffic"],
                        message: "Expected boolean, received string"
                    },
                    {
                        code: "too_big",
                        maximum: 359.5,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 359.5",
                        path: ["currentHeading"]
                    },
                    {
                        received: "Coded",
                        code: "invalid_enum_value",
                        options: ["coded", "text", "tagged"],
                        path: ["instructionsType"],
                        message: "Invalid enum value. Expected 'coded' | 'text' | 'tagged', received 'Coded'"
                    },
                    {
                        code: "too_big",
                        maximum: 5,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 5",
                        path: ["maxAlternatives"]
                    },
                    {
                        received: "summary",
                        code: "invalid_enum_value",
                        options: ["polyline", "summaryOnly"],
                        path: ["routeRepresentation"],
                        message: "Invalid enum value. Expected 'polyline' | 'summaryOnly', received 'summary'"
                    },
                    {
                        received: "motorways",
                        code: "invalid_enum_value",
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
                        message:
                            "Invalid enum value. Expected 'carTrain' | 'ferry' | 'tunnel' | 'motorway' | 'pedestrian' | 'tollRoad' | 'tollVignette' | 'country' | 'vehicleRestricted' | 'traffic' | 'urban' | 'unpaved' | 'carpool', received 'motorways'"
                    },
                    {
                        received: "medium",
                        code: "invalid_enum_value",
                        options: ["low", "normal", "high"],
                        path: ["thrillingParams", "windingness"],
                        message: "Invalid enum value. Expected 'low' | 'normal' | 'high', received 'medium'"
                    },
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "number",
                        path: ["travelMode"],
                        message: "Expected string, received number"
                    },
                    {
                        received: "arriveAt",
                        code: "invalid_enum_value",
                        options: ["departAt", "arriveBy"],
                        path: ["when", "option"],
                        message: "Invalid enum value. Expected 'departAt' | 'arriveBy', received 'arriveAt'"
                    }
                ]
            })
        );
    });
});

describe("Calculate route request schema performance tests", () => {
    // @ts-ignore
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema(routeRequestParams as CalculateRouteParams, calculateRouteRequestSchema),
                10
            )
        ).toBeLessThan(2);
    });
});
