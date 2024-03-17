import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { validateRequestSchema } from "../../shared/validation";
import { routeRequestParams } from "./requestBuilderPerf.data";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";
import { routeRequestValidationConfig } from "../calculateRouteRequestSchema";
import type { CalculateRouteParams } from "../types/calculateRouteParams";

describe("Calculate route request schema validation", () => {
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";

    test("it should fail when latitude & longitude are out of range", () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                {
                    geoInputs: [
                        [200, 180],
                        [-200, -180]
                    ],
                    apiKey,
                    commonBaseURL
                },
                routeRequestValidationConfig
            );
        expect(validationCall).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "too_big",
                        maximum: 180,
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 180",
                        path: ["geoInputs", 0, 0],
                        type: "number"
                    },
                    {
                        code: "too_big",
                        maximum: 90,
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 90",
                        path: ["geoInputs", 0, 1],
                        type: "number"
                    },
                    {
                        code: "too_small",
                        minimum: -180,
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to -180",
                        path: ["geoInputs", 1, 0],
                        type: "number"
                    },
                    {
                        code: "too_small",
                        minimum: -90,
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to -90",
                        path: ["geoInputs", 1, 1],
                        type: "number"
                    }
                ]
            })
        );
    });

    test("it should fail when format of location is incorrect - example 1", () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                { geoInputs: "4.89066,52.37317:4.49015,52.16109" as never, apiKey, commonBaseURL },
                routeRequestValidationConfig
            );
        expect(validationCall).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["geoInputs"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when there are not enough waypoints - none sent", () => {
        expect(() =>
            validateRequestSchema({ geoInputs: [], apiKey, commonBaseURL }, routeRequestValidationConfig)
        ).toThrow("Array must contain at least 1 element(s)");
    });

    test("it should fail when there are not enough waypoints - one sent", () => {
        expect(() =>
            validateRequestSchema(
                { geoInputs: [[4.89066, 52.37317]], apiKey, commonBaseURL },
                routeRequestValidationConfig
            )
        ).toThrow(
            "When passing waypoints only: at least 2 must be defined. " +
                "If passing also paths, at least one path must be defined"
        );
    });

    test("it should fail when geoInputs param is missing", () => {
        expect(() =>
            validateRequestSchema<CalculateRouteParams>(
                { apiKey, commonBaseURL } as never,
                routeRequestValidationConfig
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "undefined",
                        path: ["geoInputs"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when format of optional params are incorrect", () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                {
                    geoInputs: [
                        [4.89066, 52.37317],
                        [4.4906, 51.37317]
                    ],
                    costModel: {
                        avoid: "tollRoads" as never,
                        traffic: true as never
                        // TODO not supported in Orbis
                        // thrillingParams: {
                        //     hilliness: "low",
                        //     windingness: "medium" as never
                        // }
                    },
                    computeAdditionalTravelTimeFor: "first" as never,
                    vehicleHeading: 360,
                    // TODO not supported in Orbis in this way, to add check for the way Orbis does it
                    // instructionsType: "Coded" as never,
                    maxAlternatives: 6 as never,
                    // TODO deprecated in Orbis
                    // routeRepresentation: "summary" as never,
                    travelMode: 2 as never,
                    // TODO not supported in Orbis
                    // when: {
                    //     option: "arriveAt" as never,
                    //     date: new Date()
                    // },
                    sectionTypes: ["tunnel", "motorways"] as never,
                    apiKey,
                    commonBaseURL
                },
                routeRequestValidationConfig
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                errors: expect.arrayContaining([
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["costModel", "avoid"],
                        message: "Expected array, received string"
                    },
                    expect.objectContaining({
                        code: "invalid_type",
                        received: "boolean",
                        path: ["costModel", "traffic"]
                    }),
                    // TODO not supported in Orbis
                    // {
                    //     received: "medium",
                    //     code: "invalid_enum_value",
                    //     options: ["low", "normal", "high"],
                    //     path: ["costModel", "thrillingParams", "windingness"],
                    //     message: "Invalid enum value. Expected 'low' | 'normal' | 'high', received 'medium'"
                    // },
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "number",
                        path: ["travelMode"],
                        message: "Expected string, received number"
                    },
                    {
                        received: "first",
                        code: "invalid_enum_value",
                        options: ["none", "all"],
                        path: ["computeAdditionalTravelTimeFor"],
                        message: "Invalid enum value. Expected 'none' | 'all', received 'first'"
                    },
                    {
                        code: "too_big",
                        maximum: 359.5,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 359.5",
                        path: ["vehicleHeading"]
                    },
                    // TODO not supported in Orbis
                    // {
                    //     received: "Coded",
                    //     code: "invalid_enum_value",
                    //     options: ["coded", "text", "tagged"],
                    //     path: ["instructionsType"],
                    //     message: "Invalid enum value. Expected 'coded' | 'text' | 'tagged', received 'Coded'"
                    // },
                    {
                        code: "too_big",
                        maximum: 5,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 5",
                        path: ["maxAlternatives"]
                    },
                    // TODO not supported in Orbis
                    // {
                    //     received: "summary",
                    //     code: "invalid_enum_value",
                    //     options: ["polyline", "summaryOnly"],
                    //     path: ["routeRepresentation"],
                    //     message: "Invalid enum value. Expected 'polyline' | 'summaryOnly', received 'summary'"
                    // },
                    expect.objectContaining({
                        received: "motorways",
                        code: "invalid_enum_value",
                        options: expect.arrayContaining([
                            "carTrain",
                            "ferry",
                            "tunnel",
                            "motorway",
                            "pedestrian",
                            "tollRoad",
                            "toll",
                            "tollVignette",
                            "country",
                            "vehicleRestricted",
                            "traffic",
                            "carpool",
                            "urban",
                            "unpaved",
                            "lowEmissionZone",
                            "lanes",
                            "speedLimit",
                            "roadShields"
                        ]),
                        path: ["sectionTypes", 1]
                    })
                    // TODO not supported in Orbis
                    // {
                    //     received: "arriveAt",
                    //     code: "invalid_enum_value",
                    //     options: ["departAt", "arriveBy"],
                    //     path: ["when", "option"],
                    //     message: "Invalid enum value. Expected 'departAt' | 'arriveBy', received 'arriveAt'"
                    // }
                ])
            })
        );
    });
});

describe("Calculate route request schema performance tests", () => {
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema<CalculateRouteParams>(routeRequestParams, routeRequestValidationConfig),
                10
            )
        ).toBeLessThan(MAX_EXEC_TIMES_MS.routing.schemaValidation);
    });
});
