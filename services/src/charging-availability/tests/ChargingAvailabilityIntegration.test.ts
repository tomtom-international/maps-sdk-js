import chargingAvailability from "../ChargingAvailability";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKServiceError } from "../../shared/Errors";
import { ChargingPoint, accessibility, connectorTypes, chargingPointStatus } from "@anw/go-sdk-js/core";
import { ChargingAvailabilityResponse } from "../types/ChargingAvailabilityResponse";

describe("charging availability errors", () => {
    test("charging availability test without API key", async () => {
        await expect(chargingAvailability({ id: "1234" })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(chargingAvailability({ id: "1234" })).rejects.toMatchObject({
            service: "ChargingAvailability",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("chargingAvailability integration tests", () => {
    const statusRegex = new RegExp(chargingPointStatus.join("|"));
    const accessibilityRegex = new RegExp(accessibility.join("|"));
    const connectorTypeRegex = new RegExp(connectorTypes.join("|"));
    beforeAll(() => putIntegrationTestsAPIKey());

    test("chargingAvailability with required params", async () => {
        const chargingPointObj: ChargingPoint = {
            evseId: expect.any(String),
            status: expect.stringMatching(statusRegex),
            connectors: [
                {
                    type: expect.stringMatching(connectorTypeRegex),
                    ratedPowerKW: expect.any(Number),
                    voltageV: expect.any(Number),
                    currentA: expect.any(Number),
                    currentType: expect.any(String)
                }
            ]
        };
        const expectedResult: ChargingAvailabilityResponse = {
            chargingParkId: "528009010069650",
            chargingStations: [
                {
                    chargingStationId: "ffffffff-9408-532f-0000-000000153b86",
                    accessibility: expect.stringMatching(accessibilityRegex),
                    chargingPoints: expect.arrayContaining([chargingPointObj])
                }
            ]
        };

        const result = await chargingAvailability({ id: "528009010069650" });
        expect(result).toMatchObject(expectedResult);
        expect(result.chargingStations[0].chargingPoints.length).toBe(5);
    });

    test("chargingAvailability with connector filter", async () => {
        const chargingStationObj = {
            chargingStationId: expect.any(String),
            accessibility: expect.stringMatching(accessibilityRegex),
            chargingPoints: [
                {
                    evseId: expect.any(String),
                    status: expect.stringMatching(statusRegex),
                    connectors: [
                        { type: "Chademo", ratedPowerKW: 25.0, voltageV: 400, currentA: 62, currentType: "DC" }
                    ]
                }
            ]
        };
        const expectedResult = {
            chargingParkId: "840479002976741",
            chargingStations: [chargingStationObj, chargingStationObj]
        };

        const result = await chargingAvailability({ id: "840479002976741", connectorTypes: ["Chademo"] });
        expect(result).toMatchObject(expectedResult);
    });
});
