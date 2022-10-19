import chargingAvailability from "../ChargingAvailability";
import { ChargingAvailabilityParams } from "../types/ChargingAvailabilityParams";

describe("Geocoding schema validation", () => {
    test("it should fail when id is an invalid param", async () => {
        const invalidParams: ChargingAvailabilityParams = {
            //@ts-ignore
            id: 555
        };

        await expect(chargingAvailability(invalidParams)).rejects.toMatchObject({
            service: "ChargingAvailability",
            errors: [
                {
                    received: "number",
                    code: "invalid_type",
                    path: ["id"],
                    message: "Expected string, received number"
                }
            ]
        });
    });

    test("it should fail when connectorTypes is invalid and id is missing", async () => {
        const invalidParams: ChargingAvailabilityParams = {
            //@ts-ignore
            connectorTypes: "Tesla"
        };
        await expect(chargingAvailability(invalidParams)).rejects.toMatchObject({
            service: "ChargingAvailability",
            errors: [
                {
                    code: "invalid_type",
                    received: "undefined",
                    expected: "string",
                    message: "Required",
                    path: ["id"]
                },
                {
                    code: "invalid_type",
                    received: "string",
                    expected: "array",
                    message: "Expected array, received string",
                    path: ["connectorTypes"]
                }
            ]
        });
    });

    test("it should fail when max or min PowerKW is invalid", async () => {
        const invalidParams: ChargingAvailabilityParams = {
            id: "abc",
            //@ts-ignore
            maxPowerKW: "50",
            //@ts-ignore
            minPowerKW: "11"
        };
        await expect(chargingAvailability(invalidParams)).rejects.toMatchObject({
            service: "ChargingAvailability",
            errors: [
                {
                    code: "invalid_type",
                    received: "string",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["minPowerKW"]
                },
                {
                    code: "invalid_type",
                    received: "string",
                    expected: "number",
                    message: "Expected number, received string",
                    path: ["maxPowerKW"]
                }
            ]
        });
    });
});
