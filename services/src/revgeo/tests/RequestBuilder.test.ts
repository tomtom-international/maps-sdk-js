import reverseGeocodeReqObjectsAndURLS from "./RequestBuilder.data.json";
import reverseGeocodeReqObjects from "./RequestBuilderPerf.data.json";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { buildRevGeoRequest } from "../RequestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

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
