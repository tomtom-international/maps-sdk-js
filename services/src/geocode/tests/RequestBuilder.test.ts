import { buildGeocodingRequest } from "../RequestBuilder";
import { GeocodingParams } from "../types/GeocodingParams";
import geocodingReqObjectsAndURLs from "./RequestBuilder.data.json";
import geocodingAPIResponses from "./ResponseParserPerf.data.json";
import { GeocodingResponseAPI } from "../types/APITypes";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";
import { parseGeocodingResponse } from "../ResponseParser";

describe("Geocoding service URL building functional tests", () => {
    test.each(geocodingReqObjectsAndURLs)(
        `'%s`,
        //@ts-ignore
        (_name: string, params: GeocodingParams, url: string) => {
            expect(buildGeocodingRequest(params).toString()).toStrictEqual(url);
        }
    );
});

describe("Geocoding service response parser performance tests", () => {
    test.each(geocodingAPIResponses)(
        "'%s'",
        // @ts-ignore
        (apiResponse: GeocodingResponseAPI) => {
            expect(assertExecutionTime(() => parseGeocodingResponse(apiResponse), 10, 5)).toBeTruthy();
        }
    );
});
