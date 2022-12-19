import { buildEVChargingStationsAvailabilityRequest } from "../RequestBuilder";
import requestObjectsAndURLs from "./RequestBuilder.data.json";
import requestObjects from "./RequestBuilderPerf.data.json";
import { EVChargingStationsAvailabilityParams } from "../types/EVChargingStationsAvailabilityParams";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";

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
    test.each(requestObjects)(
        "'%s'",
        //@ts-ignore
        (_title: string, params: EVChargingStationsAvailabilityParams) => {
            expect(bestExecutionTimeMS(() => buildEVChargingStationsAvailabilityRequest(params), 10)).toBeLessThan(1);
        }
    );
});
