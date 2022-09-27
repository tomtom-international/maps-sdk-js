import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseRevGeoResponse } from "../ResponseParser";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "../ReverseGeocoding";
import { ReverseGeocodingResponseAPI } from "../types/APITypes";
import errorResponses from "../../revgeo/tests/ResponseParserError.data.json";
import { DefaultAPIResponseError, ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { defaultResponseParserError, SDKServiceError } from "../../shared/Errors";

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
            expect(parseRevGeoResponse(apiResponse, params)).toStrictEqual(expectedParsedResponse);
        }
    );
});

describe("ReverseGeocode - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponseError: ErrorObjAPI<DefaultAPIResponseError>, expectedSDKError: SDKServiceError) => {
            const sdkReverseGeocodingError = defaultResponseParserError(apiResponseError, "ReverseGeocode");
            expect(sdkReverseGeocodingError).toMatchObject(expectedSDKError);
        }
    );
});
