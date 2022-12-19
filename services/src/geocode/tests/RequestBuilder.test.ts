import { buildGeocodingRequest } from "../RequestBuilder";
import { GeocodingParams } from "../types/GeocodingParams";
import geocodingReqObjectsAndURLs from "./RequestBuilder.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import geocodingReqObjects from "./RequestBuilderPerf.data.json";

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
    test.each(geocodingReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: GeocodingParams) => {
            expect(bestExecutionTimeMS(() => buildGeocodingRequest(params), 10)).toBeLessThan(2);
        }
    );
});
