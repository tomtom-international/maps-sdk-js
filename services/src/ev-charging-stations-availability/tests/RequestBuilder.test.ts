import { buildEVChargingStationsAvailabilityRequest } from "../RequestBuilder";
import requestObjectsAndURLs from "./RequestBuilder.data.json";
import requestObjects from "./RequestBuilderPerf.data.json";
import { EVChargingStationsAvailabilityParams } from "../types/EVChargingStationsAvailabilityParams";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
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
