import reverseGeocodeReqObjects from "./RequestBuilderForPerf.data.json";
import reverseGeocodeAPIResponses from "./ResponseParserForPerf.data.json";
import { buildRevGeoRequest } from "../../RequestBuilder";
import { assertExecutionTime } from "../../../shared/tests/PerformanceTestUtils";
import { ReverseGeocodingResponseAPI } from "../../types/APITypes";
import { parseRevGeoResponse } from "../../ResponseParser";
import { ReverseGeocodingParams } from "../../types/ReverseGeocodingParams";

describe("Reverse Geocode request URL builder performance tests", () => {
    test.each(reverseGeocodeReqObjects)(
        "'%s'",
        // @ts-ignore
        (params: ReverseGeocodingParams) => {
            expect(assertExecutionTime(() => buildRevGeoRequest(params), 10, 2)).toBeTruthy();
        }
    );
});

describe("Reverse Geocode response parser performance tests", () => {
    test.each(reverseGeocodeAPIResponses)(
        "'%s'",
        // @ts-ignore
        (params: ReverseGeocodingParams, apiResponse: ReverseGeocodingResponseAPI) => {
            expect(assertExecutionTime(() => parseRevGeoResponse(apiResponse, params), 10, 2)).toBeTruthy();
        }
    );
});
