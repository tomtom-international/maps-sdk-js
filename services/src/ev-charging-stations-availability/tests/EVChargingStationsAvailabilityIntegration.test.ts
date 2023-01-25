import EVChargingStationsAvailability from "../EVChargingStationsAvailability";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKServiceError } from "../../shared";
import { accessibility, ChargingPoint, chargingPointStatus, connectorTypes } from "@anw/go-sdk-js/core";
import { EVChargingStationsAvailabilityResponse } from "../types/EVChargingStationsAvailabilityResponse";

describe("charging availability errors", () => {
    test("charging availability test without API key", async () => {
        await expect(EVChargingStationsAvailability({ id: "1234" })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(EVChargingStationsAvailability({ id: "1234" })).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("EVChargingStationsAvailability integration tests", () => {
    const statusRegex = new RegExp(chargingPointStatus.join("|"));
    const accessibilityRegex = new RegExp(accessibility.join("|"));
    const connectorTypeRegex = new RegExp(connectorTypes.join("|"));
    beforeAll(() => putIntegrationTestsAPIKey());

    test("EVChargingStationsAvailability with required params", async () => {
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
        const expectedResult: EVChargingStationsAvailabilityResponse = {
            chargingParkId: "528009010069650",
            chargingStations: [
                {
                    chargingStationId: "ffffffff-9408-532f-0000-000000153b86",
                    accessibility: expect.stringMatching(accessibilityRegex),
                    chargingPoints: expect.arrayContaining([chargingPointObj])
                }
            ]
        };

        const result = await EVChargingStationsAvailability({ id: "528009010069650" });
        expect(result).toMatchObject(expectedResult);
        expect(result.chargingStations[0].chargingPoints.length).toBeGreaterThan(0);
    });

    test("EVChargingStationsAvailability with connector filter", async () => {
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

        const result = await EVChargingStationsAvailability({ id: "840479002976741", connectorTypes: ["Chademo"] });
        expect(result).toMatchObject(expectedResult);
    });
});
