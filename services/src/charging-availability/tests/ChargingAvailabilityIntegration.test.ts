import chargingAvailability from "../ChargingAvailability";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKServiceError } from "../../shared/Errors";
import { ChargingPoint } from "@anw/go-sdk-js/core";
import { ChargingAvailabilityResponse } from "../types/ChargingAvailabilityResponse";

const statusRegex = /Available|Reserved|Occupied|OutOfService|Unknown/;
const accessibilityRegex =
    /Unspecified|NoRestriction|GenericRestriction|ResidentsOnly|EmployeesOnly|AuthorizedPersonnelOnly|MembersOnly/;
const connectorTypeRegex =
    /StandardHouseholdCountrySpecific|IEC62196Type1|IEC62196Type1CCS|IEC62196Type2CableAttached|IEC62196Type2Outlet|IEC62196Type2CCS|IEC62196Type3|Chademo|GBT20234Part2|GBT20234Part3|IEC60309AC3PhaseRed|IEC60309AC1PhaseBlue|IEC60309DCWhite|Tesla/;

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
    beforeAll(() => putIntegrationTestsAPIKey());

    test("chargingAvailability with default params", async () => {
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
