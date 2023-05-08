import { buildEVChargingStationsAvailabilityRequest } from "../requestBuilder";
import requestObjectsAndURLs from "./requestBuilder.data.json";
import requestObjects from "./requestBuilderPerf.data.json";
import { EVChargingStationsAvailabilityParams } from "../types/evChargingStationsAvailabilityParams";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("EV charging stations availability URL building functional tests", () => {
    test.each(requestObjectsAndURLs)(
        "'%s'",
        //@ts-ignore
        (_title: string, params: EVChargingStationsAvailabilityParams, url: string) => {
            expect(buildEVChargingStationsAvailabilityRequest(params).toString()).toStrictEqual(url);
        }
    );
});

describe("EV charging stations availability URL building performance tests", () => {
    test("EV charging stations availability URL building performance test", async () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    buildEVChargingStationsAvailabilityRequest(requestObjects as EVChargingStationsAvailabilityParams),
                10
            )
        ).toBeLessThan(MAX_EXEC_TIMES_MS.ev.requestBuilding);
    });
});
