import { CalculateRouteWaypointInputs } from "../types/CalculateRouteParams";
import { validateRequestSchema } from "../../shared/Validation";
import { calculateRouteRequestSchema } from "../CalculateRouteRequestSchema";

describe("Routing: Vehicle parameter request schema tests", () => {
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";
    const locations: CalculateRouteWaypointInputs = [
        [4.89066, 52.37317],
        [4.49015, 52.16109],
        [4.47059, 51.92291]
    ];
    test("it should fail when format of vehicle dimensions are incorrect", async () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    locations,
                    vehicle: {
                        dimensions: {
                            //@ts-ignore
                            weightKG: "1900"
                        },
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
                calculateRouteRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "number",
                        message: "Expected number, received string",
                        path: ["vehicle", "dimensions", "weightKG"],
                        received: "string"
                    }
                ]
            })
        );
    });

    test("it should fail when incorrect engine combustion type is specified", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    locations,
                    vehicle: {
                        dimensions: {
                            weightKG: 1900
                        },
                        consumption: {
                            // @ts-ignore
                            engineType: "EV",
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
                calculateRouteRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        received: "EV",
                        code: "invalid_enum_value",
                        options: ["combustion", "electric"],
                        path: ["vehicle", "consumption", "engineType"],
                        message: "Invalid enum value. Expected 'combustion' | 'electric', received 'EV'"
                    }
                ]
            })
        );
    });

    test("it should fail when format of efficiency within vehicle consumption is incorrect", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    locations,
                    vehicle: {
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
                                // @ts-ignore
                                acceleration: "0.66",
                                deceleration: 1.2,
                                uphill: -0.1,
                                // @ts-ignore
                                downhill: "0.73"
                            }
                        }
                    }
                },
                calculateRouteRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "efficiency", "acceleration"],
                        message: "Expected number, received string"
                    },
                    {
                        code: "too_big",
                        maximum: 1,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 1",
                        path: ["vehicle", "consumption", "efficiency", "deceleration"]
                    },
                    {
                        code: "too_small",
                        minimum: 0,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to 0",
                        path: ["vehicle", "consumption", "efficiency", "uphill"]
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "efficiency", "downhill"],
                        message: "Expected number, received string"
                    }
                ]
            })
        );
    });
    test("it should fail when format of electric consumption model is incorrect", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    locations,
                    vehicle: {
                        consumption: {
                            engineType: "electric",
                            speedsToConsumptionsKWH: [
                                // @ts-ignore
                                { speedKMH: "50", consumptionUnitsPer100KM: 8.2 },
                                // @ts-ignore
                                { speedKMH: 130, consumptionUnitsPer100KM: "21.3" }
                            ],
                            // @ts-ignore
                            auxiliaryPowerInkW: "1.7",
                            // @ts-ignore
                            consumptionInKWHPerKMAltitudeGain: 501,
                            // @ts-ignore
                            recuperationInKWHPerKMAltitudeLoss: "3.8",
                            // @ts-ignore
                            currentChargeKWH: "43",
                            // @ts-ignore
                            maxChargeKWH: "85",
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73
                            }
                        }
                    }
                },
                calculateRouteRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "speedsToConsumptionsKWH",
                            0,
                            "speedKMH"
                        ],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "speedsToConsumptionsKWH",
                            1,
                            "consumptionUnitsPer100KM"
                        ],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "auxiliaryPowerInkW"
                        ],
                        message: "Expected number, received string"
                    },
                    {
                        code: "too_big",
                        maximum: 500,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 500",
                        path: [
                            "vehicle",
                            "consumption",
                            "consumptionInKWHPerKMAltitudeGain"
                        ]
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "recuperationInKWHPerKMAltitudeLoss"
                        ],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "currentChargeKWH"
                        ],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: [
                            "vehicle",
                            "consumption",
                            "maxChargeKWH"
                        ],
                        message: "Expected number, received string"
                    }
                ]
            })
        );
    });
    test("it should fail when format of combustion consumption model is incorrect & efficiency object is missing", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    locations,
                    vehicle: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                // @ts-ignore
                                { speedKMH: "50", consumptionUnitsPer100KM: 8.2 },
                                // @ts-ignore
                                { speedKMH: 130, consumptionUnitsPer100KM: "21.3" }
                            ],
                            // @ts-ignore
                            auxiliaryPowerInLitersPerHour: "1.7",
                            // @ts-ignore
                            currentFuelLiters: "43",
                            // @ts-ignore
                            fuelEnergyDensityInMJoulesPerLiter: "85"
                        }
                    }
                },
                calculateRouteRequestSchema
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "object",
                        received: "undefined",
                        path: ["vehicle", "consumption", "efficiency"],
                        message: "Required"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "speedsToConsumptionsLiters", 0, "speedKMH"],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "speedsToConsumptionsLiters", 1, "consumptionUnitsPer100KM"],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "auxiliaryPowerInLitersPerHour"],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "fuelEnergyDensityInMJoulesPerLiter"],
                        message: "Expected number, received string"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["vehicle", "consumption", "currentFuelLiters"],
                        message: "Expected number, received string"
                    }
                ]
            })
        );
    });
});
