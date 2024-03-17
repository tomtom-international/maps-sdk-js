import { buildGeocodingRequest } from "../requestBuilder";
import type { GeocodingParams } from "../types/geocodingParams";
import geocodingReqObjectsAndURLs from "./requestBuilder.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import geocodingReqObjects from "./requestBuilderPerf.data.json";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

describe("Geocoding service URL building functional tests", () => {
    test.each(geocodingReqObjectsAndURLs)(
        `'%s`,
        //@ts-ignore
        (_name: string, params: GeocodingParams, url: string) => {
            expect(buildGeocodingRequest(params).toString()).toStrictEqual(url);
        }
    );
});

describe("Geocoding service request builder performance tests", () => {
    test("Geocoding service request builder performance test", () => {
        expect(
            bestExecutionTimeMS(() => buildGeocodingRequest(geocodingReqObjects as GeocodingParams), 10)
        ).toBeLessThan(MAX_EXEC_TIMES_MS.geocoding.requestBuilding);
    });
});
