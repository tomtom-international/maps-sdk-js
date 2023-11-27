import { isBBoxWithArea, PolygonFeature } from "@anw/maps-sdk-js/core";
import { putIntegrationTestsAPIKey } from "../../shared/tests/integrationTestUtils";
import { calculateReachableRange, calculateReachableRanges } from "../calculateReachableRange";
import { ReachableRangeParams } from "../types/reachableRangeParams";

describe("Reachable Range integration tests", () => {
    beforeAll(() => putIntegrationTestsAPIKey());

    const origin = [4.87554, 52.38121];

    const expectBasics = (result: PolygonFeature<ReachableRangeParams>, params: ReachableRangeParams): void => {
        expect(result).toBeDefined();
        expect(isBBoxWithArea(result.bbox)).toBe(true);
        expect(result.geometry.coordinates).toHaveLength(1);
        expect(result.geometry.coordinates[0].length).toBeGreaterThan(40);
        expect(result.properties).toMatchObject(params);
        // checking that also common service params are present:
        expect(result.properties).toHaveProperty("apiKey");
        expect(result.properties).toHaveProperty("commonBaseURL");
    };

    // eslint-disable-next-line jest/expect-expect
    test("Time-based reachable range", async () => {
        const params: ReachableRangeParams = { origin, budget: { type: "timeMinutes", value: 15 } };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Time-based reachable range with departure date", async () => {
        const params: ReachableRangeParams = {
            origin,
            budget: { type: "timeMinutes", value: 15 },
            when: { option: "departAt", date: new Date(Date.UTC(2025, 8, 16, 15, 48)) }
        };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Distance-based reachable range", async () => {
        const params: ReachableRangeParams = { origin, budget: { type: "distanceKM", value: 5 } };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("EV reachable range for remaining charge PCT", async () => {
        const params: ReachableRangeParams = {
            origin,
            budget: { type: "remainingChargeCPT", value: 20 }
            // vehicle: {
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 80,
            //         model: {
            //             charging: { maxChargeKWH: 85 },
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ]
            //             }
            //         }
            //     }
            // }
        };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("EV reachable range for spent charge PCT", async () => {
        const params: ReachableRangeParams = {
            origin,
            budget: { type: "spentChargePCT", value: 25 },
            when: { option: "departAt", date: new Date(Date.UTC(2030, 8, 16, 15, 0)) }
            // vehicle: {
            //     engine: {
            //         type: "electric",
            //         currentChargePCT: 50,
            //         model: {
            //             charging: { maxChargeKWH: 100 },
            //             consumption: {
            //                 speedsToConsumptionsKWH: [
            //                     { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
            //                     { speedKMH: 130, consumptionUnitsPer100KM: 21.3 }
            //                 ]
            //             }
            //         }
            //     }
            // }
        };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Fuel-based reachable range", async () => {
        const params: ReachableRangeParams = {
            origin,
            budget: { type: "spentFuelLiters", value: 55 }
            // vehicle: {
            //     engine: {
            //         type: "combustion",
            //         currentFuelInLiters: 60,
            //         model: {
            //             consumption: { speedsToConsumptionsLiters: [{ speedKMH: 100, consumptionUnitsPer100KM: 6 }] }
            //         }
            //     }
            // }
        };
        expectBasics(await calculateReachableRange(params), params);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Multiple reachable ranges", async () => {
        const paramsArray: ReachableRangeParams[] = [
            { origin: [4.87554, 52.38121], budget: { type: "timeMinutes", value: 15 } },
            { origin: [4.87554, 52.35121], budget: { type: "distanceKM", value: 100 } },
            { origin: [4.87554, 52.32121], budget: { type: "timeMinutes", value: 60 } }
        ];
        const results = await calculateReachableRanges(paramsArray);
        expect(results.features).toHaveLength(paramsArray.length);
        results.features.forEach((feature, index) => expectBasics(feature, paramsArray[index]));
    });
});
