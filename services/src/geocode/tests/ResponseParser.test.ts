import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
import { GeocodingResponseAPI } from "../types/APITypes";
import { GeocodingResponse } from "../types/GeocodingResponse";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import geocodingAPIResponses from "./ResponseParserPerf.data.json";

describe("Geocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: GeocodingResponseAPI, sdkResponse: GeocodingResponse) => {
            expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
        }
    );
});

describe("Geocoding service response parser performance tests", () => {
    test.each(geocodingAPIResponses)(
        "'%s'",
        // @ts-ignore
        (apiResponse: GeocodingResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseGeocodingResponse(apiResponse), 10)).toBeLessThan(5);
        }
    );
});
