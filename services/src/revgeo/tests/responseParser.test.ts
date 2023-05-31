import omit from "lodash/omit";
import apiAndParsedResponses from "./responseParser.data.json";
import apiResponses from "./responseParserPerf.data.json";
import { parseRevGeoResponse } from "../responseParser";
import { ReverseGeocodingParams } from "../types/reverseGeocodingParams";
import { ReverseGeocodingResponse } from "../reverseGeocoding";
import { ReverseGeocodingResponseAPI } from "../types/apiTypes";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

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
            expect(bestExecutionTimeMS(() => parseRevGeoResponse(apiResponse, params), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.revGeo.responseParsing
            );
        }
    );
});
