import EVChargingStationsAvailability, { evChargingStationsAvailability } from "../EVChargingStationsAvailability";
import { EVChargingStationsAvailabilityParams } from "../types/EVChargingStationsAvailabilityParams";
import requestObjects from "./RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { evChargingStationsAvailabilityRequestSchema } from "../EVChargingStationsAvailabilityRequestSchema";
import { validateRequestSchema } from "../../shared/Validation";

describe("EV Charging Stations availability schema validation", () => {
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";

    test("it should fail when id is an invalid param", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            //@ts-ignore
            id: 555,
            validateRequest: true,
            apiKey,
            commonBaseURL
        };

        const validationResult = () =>
            validateRequestSchema(invalidParams, evChargingStationsAvailabilityRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        expected: "string",
                        received: "number",
                        code: "invalid_type",
                        path: ["id"],
                        message: "Expected string, received number"
                    }
                ]
            })
        );
    });

    test(
        "Charging station availability(Without API Key): " + "Skipping schema validation should result in 403",
        async () => {
            await expect(
                evChargingStationsAvailability({
                    //@ts-ignore
                    connectorTypes: "Tesla",
                    validateRequest: false
                })
            ).rejects.toMatchObject({
                service: "EVChargingStationsAvailability",
                message: "Request failed with status code 403",
                status: 403
            });
        }
    );

    test("it should fail when connectorTypes is invalid and id is missing", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            //@ts-ignore
            connectorTypes: "Tesla",
            apiKey,
            commonBaseURL
        };
        const validationResult = () =>
            validateRequestSchema(invalidParams, evChargingStationsAvailabilityRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
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
            })
        );
    });
    test("it should fail when connectorTypes is array of invalid values", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            id: "abc",
            //@ts-ignore
            connectorTypes: ["Tesla", "any string"],
            apiKey,
            commonBaseURL
        };
        const validationResult = () =>
            validateRequestSchema(invalidParams, evChargingStationsAvailabilityRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_enum_value",
                        received: "any string",
                        options: [
                            "StandardHouseholdCountrySpecific",
                            "IEC62196Type1",
                            "IEC62196Type1CCS",
                            "IEC62196Type2CableAttached",
                            "IEC62196Type2Outlet",
                            "IEC62196Type2CCS",
                            "IEC62196Type3",
                            "Chademo",
                            "GBT20234Part2",
                            "GBT20234Part3",
                            "IEC60309AC3PhaseRed",
                            "IEC60309AC1PhaseBlue",
                            "IEC60309DCWhite",
                            "Tesla"
                        ],
                        message:
                            "Invalid enum value. Expected 'StandardHouseholdCountrySpecific' | 'IEC62196Type1' " +
                            "| 'IEC62196Type1CCS' | 'IEC62196Type2CableAttached' | 'IEC62196Type2Outlet' " +
                            "| 'IEC62196Type2CCS' | 'IEC62196Type3' | 'Chademo' | 'GBT20234Part2' | 'GBT20234Part3' " +
                            "| 'IEC60309AC3PhaseRed' | 'IEC60309AC1PhaseBlue' | 'IEC60309DCWhite' " +
                            "| 'Tesla', received 'any string'",
                        path: ["connectorTypes", 1]
                    }
                ]
            })
        );
    });

    test("it should fail when max or min PowerKW is invalid", async () => {
        const invalidParams: EVChargingStationsAvailabilityParams = {
            id: "abc",
            //@ts-ignore
            maxPowerKW: "50",
            //@ts-ignore
            minPowerKW: "11",
            apiKey,
            commonBaseURL
        };
        const validationResult = () =>
            validateRequestSchema(invalidParams, evChargingStationsAvailabilityRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
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
            })
        );
    });
});

describe("EV charging stations availability request schema performance tests", () => {
    test.each(requestObjects)(
        "'%s'",
        //@ts-ignore
        (_title: string, params: EVChargingStationsAvailabilityParams) => {
            expect(
                bestExecutionTimeMS(
                    () => validateRequestSchema(params, evChargingStationsAvailabilityRequestSchema),
                    10
                )
            ).toBeLessThan(1);
        }
    );
});
