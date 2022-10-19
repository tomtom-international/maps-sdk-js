import chargingAvailability from "../ChargingAvailability";
import { putIntegrationTestsAPIKey } from "../../shared/tests/IntegrationTestUtils";
import { SDKServiceError } from "../../shared/Errors";

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
        const expectedResult = {
            chargingParkId: "528009010069650",
            chargingStations: [
                {
                    chargingStationId: "ffffffff-9408-532f-0000-000000153b86",
                    accessibility: "NoRestriction",
                    chargingPoints: [
                        {
                            evseId: "NL*NUO*EEVB*P1811473*1",
                            connectors: [
                                {
                                    type: "IEC62196Type2Outlet",
                                    ratedPowerKW: 11.0,
                                    voltageV: 400,
                                    currentA: 16,
                                    currentType: "AC3"
                                }
                            ]
                        },
                        {
                            evseId: "NL*NUO*EEVB*P1811473*3",
                            connectors: [
                                {
                                    type: "IEC62196Type2Outlet",
                                    ratedPowerKW: 11.0,
                                    voltageV: 400,
                                    currentA: 16,
                                    currentType: "AC3"
                                }
                            ]
                        },
                        {
                            evseId: "NL*NUO*EEVB*P1811473*2",
                            connectors: [
                                {
                                    type: "IEC62196Type2Outlet",
                                    ratedPowerKW: 11.0,
                                    voltageV: 400,
                                    currentA: 16,
                                    currentType: "AC3"
                                }
                            ]
                        },
                        {
                            evseId: "NL*NUO*EEVB*P1834159*2",
                            connectors: [
                                {
                                    type: "IEC62196Type2CableAttached",
                                    ratedPowerKW: 11.0,
                                    voltageV: 400,
                                    currentA: 16,
                                    currentType: "AC3"
                                }
                            ]
                        },
                        {
                            evseId: "NL*NUO*EEVB*P1834159*1",
                            connectors: [
                                {
                                    type: "IEC62196Type2CableAttached",
                                    ratedPowerKW: 11.0,
                                    voltageV: 400,
                                    currentA: 16,
                                    currentType: "AC3"
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = await chargingAvailability({ id: "528009010069650" });
        expect(result).toMatchObject(expectedResult);
    });

    test("chargingAvailability with station filter", async () => {
        const expectedResult = {
            chargingParkId: "840479002976741",
            chargingStations: [
                {
                    chargingStationId: "00000000-3399-0f2c-0000-000200153b86",
                    accessibility: "NoRestriction",
                    chargingPoints: [
                        {
                            evseId: "16999259726",
                            status: "Unknown",
                            connectors: [
                                { type: "Chademo", ratedPowerKW: 25.0, voltageV: 400, currentA: 62, currentType: "DC" }
                            ]
                        }
                    ]
                },
                {
                    chargingStationId: "00000000-3399-0f2c-0000-000100153b86",
                    accessibility: "NoRestriction",
                    chargingPoints: [
                        {
                            evseId: "16999259726",
                            status: "Unknown",
                            connectors: [
                                { type: "Chademo", ratedPowerKW: 25.0, voltageV: 400, currentA: 62, currentType: "DC" }
                            ]
                        }
                    ]
                }
            ]
        };

        const result = await chargingAvailability({ id: "840479002976741", connectorTypes: ["Chademo"] });
        expect(result).toEqual(expect.objectContaining(expectedResult));
    });
});
