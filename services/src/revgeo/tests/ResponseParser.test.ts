import omit from "lodash/omit";
import apiAndParsedResponses from "./ResponseParser.data.json";
import apiResponses from "./ResponseParserPerf.data.json";
import { parseRevGeoResponse } from "../ResponseParser";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "../ReverseGeocoding";
import { ReverseGeocodingResponseAPI } from "../types/APITypes";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

describe("ReverseGeocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            params: ReverseGeocodingParams,
            apiResponse: ReverseGeocodingResponseAPI,
            expectedParsedResponse: ReverseGeocodingResponse
        ) => {
            const response = parseRevGeoResponse(apiResponse, params);
            expect(omit(response, "id")).toStrictEqual(expectedParsedResponse);
            // (IDs are to be generated at random)
            expect(response.id).toBeTruthy();
            expect(response.id).toEqual(expect.any(String));
        }
    );
});

describe("ReverseGeocode response parsing performance tests", () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: ReverseGeocodingParams, apiResponse: ReverseGeocodingResponseAPI) => {
            expect(assertExecutionTime(() => parseRevGeoResponse(apiResponse, params), 10, 2)).toBeTruthy();
        }
    );
});
