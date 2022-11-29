import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
import { GeocodingResponseAPI } from "../types/APITypes";
import { GeocodingResponse } from "../types/GeocodingResponse";
import geocodingReqObjects from "./RequestBuilderPerf.data.json";
import { GeocodingParams } from "../types/GeocodingParams";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";
import { buildGeocodingRequest } from "../RequestBuilder";

describe("Geocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: GeocodingResponseAPI, sdkResponse: GeocodingResponse) => {
            expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
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
