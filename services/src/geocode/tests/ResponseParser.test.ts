import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
import errorResponses from "../../geocode/tests/ResponseParserError.data.json";
import { GeocodeAPIResponseError } from "../../shared/types/APIResponseErrorTypes";
import { geocodeResponseErrorParser } from "../GeocodingResponseErrorParser";

describe("Geocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: never, sdkResponse: never) => {
            expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
        }
    );
});

describe("Geocode - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (errorCode: number, errorDesc: string, apiErrorResponse: GeocodeAPIResponseError) => {
            const apiError = {
                status: errorCode,
                message: errorDesc,
                data: apiErrorResponse
            };
            const sdkError = geocodeResponseErrorParser(apiError, "Geocode");
            expect(sdkError.message).toEqual(apiErrorResponse.errorText);
        }
    );
});
