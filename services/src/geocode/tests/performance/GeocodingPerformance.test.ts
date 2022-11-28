import { assertExecutionTime } from "../../../shared/tests/PerformanceTestUtils";
import { GeocodingResponseAPI } from "../../types/APITypes";
import { parseGeocodingResponse } from "../../ResponseParser";
import geocodingAPIResponses from "../performance/ResponseParserForPerf.data.json";
import geocodingReqObjects from "../performance/RequestBuilderForPerf.data.json";
import { buildGeocodingRequest } from "../../RequestBuilder";
import { GeocodingParams } from "../../types/GeocodingParams";

describe("Geocoding service response parser performance tests", () => {
    test.each(geocodingAPIResponses)(
        "'%s'",
        // @ts-ignore
        (apiResponse: GeocodingResponseAPI) => {
            expect(assertExecutionTime(() => parseGeocodingResponse(apiResponse), 10, 5)).toBeTruthy();
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
