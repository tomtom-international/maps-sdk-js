import { calculateRoute } from "../CalculateRoute";
import {CalculateRouteWaypointInputs} from "../types/CalculateRouteParams";

describe("Routing: Vehicle parameter request schema tests", () => {
    const locations : CalculateRouteWaypointInputs = [
        [4.89066, 52.37317],
        [4.49015, 52.16109],
        [4.47059, 51.92291]
    ]
    test("it should fail when format of vehicle dimensions are incorrect", async () => {
        await expect(
            calculateRoute({
                locations,
                vehicle: {
                    dimensions: {
                        //@ts-ignore
                        weightKG: "1900",
                        //@ts-ignore
                        lengthMeters: "4.62",
                        //@ts-ignore
                        widthMeters: "2",
                        //@ts-ignore
                        heightMeters: "3",
                        //@ts-ignore
                        axleWeightKG: "1900"
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
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "dimensions", "lengthMeters"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "dimensions", "widthMeters"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "dimensions", "heightMeters"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "dimensions", "weightKG"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "dimensions", "axleWeightKG"],
                    received: "string"
                }
            ]
        });
    });
    test("it should fail when incorrect engine combustion type is specified", async () => {
        await expect(
            calculateRoute({
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
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_enum_value",
                    message: "Invalid enum value. Expected 'combustion' | 'electric', received 'EV'",
                    path: ["vehicle", "consumption", "engineType"],
                    received: "EV"
                }
            ]
        });
    });
    test("it should fail when format of efficiency within vehicle consumption is incorrect", async () => {
        await expect(
            calculateRoute({
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
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "efficiency", "acceleration"],
                    received: "string"
                },
                {
                    code: "too_big",
                    maximum: 1,
                    type: "number",
                    message: "Number must be less than or equal to 1",
                    path: ["vehicle", "consumption", "efficiency", "deceleration"]
                },
                {
                    code: "too_small",
                    minimum: 0,
                    type: "number",
                    message: "Number must be greater than or equal to 0",
                    path: ["vehicle", "consumption", "efficiency", "uphill"]
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "efficiency", "downhill"],
                    received: "string"
                }
            ]
        });
    });
    test("it should fail when format of electric consumption model is incorrect", async () => {
        await expect(
            calculateRoute({
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
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "speedsToConsumptionsKWH", 0, "speedKMH"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "speedsToConsumptionsKWH", 1, "consumptionUnitsPer100KM"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "auxiliaryPowerInkW"],
                    received: "string"
                },
                {
                    code: "too_big",
                    inclusive: true,
                    maximum: 500,
                    type: "number",
                    message: "Number must be less than or equal to 500",
                    path: ["vehicle", "consumption", "consumptionInKWHPerKMAltitudeGain"]
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "recuperationInKWHPerKMAltitudeLoss"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "currentChargeKWH"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "maxChargeKWH"],
                    received: "string"
                }
            ]
        });
    });
    test("it should fail when format of combustion consumption model is incorrect & efficiency object is missing", async () => {
        await expect(
            calculateRoute({
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
            })
        ).rejects.toMatchObject({
            service: "Routing",
            errors: [
                {
                    code: "invalid_type",
                    path: ["vehicle", "consumption", "efficiency"]
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "speedsToConsumptionsLiters", 0, "speedKMH"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "speedsToConsumptionsLiters", 1, "consumptionUnitsPer100KM"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "auxiliaryPowerInLitersPerHour"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "fuelEnergyDensityInMJoulesPerLiter"],
                    received: "string"
                },
                {
                    code: "invalid_type",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["vehicle", "consumption", "currentFuelLiters"],
                    received: "string"
                }
            ]
        });
    });
});
