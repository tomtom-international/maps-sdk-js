import reverseGeocodeReqObjectsAndURLS from "./requestBuilder.data.json";
import reverseGeocodeReqObjects from "./requestBuilderPerf.data.json";
import { ReverseGeocodingParams } from "../types/reverseGeocodingParams";
import { buildRevGeoRequest } from "../requestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

describe("Reverse Geocoding request URL building functional tests", () => {
    test.each(reverseGeocodeReqObjectsAndURLS)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams, url: string) => {
            expect(buildRevGeoRequest(params).toString()).toStrictEqual(url);
        }
    );
});

describe("Reverse Geocoding request URL building performance test", () => {
    test.each(reverseGeocodeReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams) => {
            expect(bestExecutionTimeMS(() => buildRevGeoRequest(params), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.revGeo.requestBuilding
            );
        }
    );
});
