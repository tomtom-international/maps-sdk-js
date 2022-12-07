import EVChargingStationsAvailability from "../EVChargingStationsAvailability";
import { EVChargingStationsAvailabilityParams } from "../types/EVChargingStationsAvailabilityParams";

describe("EV Charging Stations availability schema validation", () => {
    test("it should fail when id is an invalid param", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            //@ts-ignore
            id: 555
        };

        await expect(EVChargingStationsAvailability(invalidParams)).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
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
        const invalidParams: EVChargingStationsAvailabilityParams = {
            //@ts-ignore
            connectorTypes: "Tesla"
        };
        await expect(EVChargingStationsAvailability(invalidParams)).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
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

    test("it should fail when connectorTypes is array of invalid values", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            id: "abc",
            //@ts-ignore
            connectorTypes: ["Tesla", "any string"]
        };
        await expect(EVChargingStationsAvailability(invalidParams)).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
            errors: [
                {
                    code: "invalid_enum_value",
                    received: "any string",
                    message:
                        "Invalid enum value. Expected 'StandardHouseholdCountrySpecific' | 'IEC62196Type1' " +
                        "| 'IEC62196Type1CCS' | 'IEC62196Type2CableAttached' | 'IEC62196Type2Outlet' " +
                        "| 'IEC62196Type2CCS' | 'IEC62196Type3' | 'Chademo' | 'GBT20234Part2' | 'GBT20234Part3' " +
                        "| 'IEC60309AC3PhaseRed' | 'IEC60309AC1PhaseBlue' | 'IEC60309DCWhite' " +
                        "| 'Tesla', received 'any string'",
                    path: ["connectorTypes", 1]
                }
            ]
        });
    });

    test("it should fail when max or min PowerKW is invalid", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            id: "abc",
            //@ts-ignore
            maxPowerKW: "50",
            //@ts-ignore
            minPowerKW: "11"
        };
        await expect(EVChargingStationsAvailability(invalidParams)).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
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
