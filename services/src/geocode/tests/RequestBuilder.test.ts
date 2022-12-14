import { buildGeocodingRequest } from "../RequestBuilder";
import { GeocodingParams } from "../types/GeocodingParams";
import geocodingReqObjectsAndURLs from "./RequestBuilder.data.json";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";
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
            expect(assertExecutionTime(() => buildGeocodingRequest(params), 10, 2)).toBeTruthy();
        }
    );
});
