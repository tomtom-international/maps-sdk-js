import {
    accessibility,
    EVChargingStationsAvailability,
    ChargingPoint,
    chargingPointStatus,
    connectorTypes
} from "@anw/maps-sdk-js/core";
import evChargingStationsAvailability, { buildPlacesWithEVAvailability } from "../EVChargingStationsAvailability";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKServiceError } from "../../shared";
import { search } from "../../search";

describe("charging availability errors", () => {
    test("charging availability test without API key", async () => {
        await expect(evChargingStationsAvailability({ id: "1234" })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(evChargingStationsAvailability({ id: "1234" })).rejects.toMatchObject({
            service: "EVChargingStationsAvailability",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("evChargingStationsAvailability integration tests", () => {
    const statusRegex = new RegExp(chargingPointStatus.join("|"));
    const accessibilityRegex = new RegExp(accessibility.join("|"));
    const connectorTypeRegex = new RegExp(connectorTypes.join("|"));
    beforeAll(() => putIntegrationTestsAPIKey());

    test("evChargingStationsAvailability with required params", async () => {
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
        const expectedResult: EVChargingStationsAvailability = {
            chargingParkId: "528009010069650",
            chargingStations: [
                {
                    chargingStationId: "ffffffff-9408-532f-0000-000000153b86",
                    accessibility: expect.stringMatching(accessibilityRegex),
                    chargingPoints: expect.arrayContaining([chargingPointObj])
                }
            ],
            chargingPointAvailability: {
                count: expect.any(Number),
                statusCounts: expect.any(Object)
            },
            connectorAvailabilities: expect.any(Array)
        };

        const result = await evChargingStationsAvailability({ id: "528009010069650" });
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

        const result = await evChargingStationsAvailability({ id: "840479002976741", connectorTypes: ["Chademo"] });
        expect(result).toMatchObject(expectedResult);
    });

    test("search combined with buildPlacesWithEVAvailability", async () => {
        const evStationsWithoutAvailability = await search({
            query: "",
            poiCategories: ["ELECTRIC_VEHICLE_CHARGING_STATION"],
            position: [13.41273, 52.52308], // Berlin
            limit: 3
        });

        const evStationsWithAvailability = await buildPlacesWithEVAvailability(evStationsWithoutAvailability);
        const resultFeatures = evStationsWithAvailability.features;
        expect(resultFeatures).toHaveLength(evStationsWithoutAvailability.features.length);
        expect(resultFeatures.every((feature) => feature.properties.chargingPark?.connectors)).toBeTruthy();
        expect(resultFeatures.some((feature) => feature.properties.chargingPark?.availability)).toBeTruthy();
    });
});
