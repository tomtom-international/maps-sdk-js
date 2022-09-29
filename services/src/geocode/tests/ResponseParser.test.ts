import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
import errorResponses from "../../geocode/tests/ResponseParserError.data.json";
import { ErrorObjAPI } from "../../shared/types/APIResponseErrorTypes";
import { defaultResponseParserError, SDKServiceError } from "../../shared/Errors";
import { GeocodingResponseAPI } from "../types/APITypes";
import { GeocodingResponse } from "../types/GeocodingResponse";

describe("Geocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        (_name: string, apiResponse: GeocodingResponseAPI, sdkResponse: GeocodingResponse) => {
            expect(parseGeocodingResponse(apiResponse)).toStrictEqual(sdkResponse);
        }
    );
});

describe("Geocode - error response parsing tests", () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponseError: ErrorObjAPI<GeocodeAPIResponseError>, expectedSDKError: SDKServiceError) => {
            const sdkGeocodingError = defaultResponseParserError(apiResponseError, "Geocode");
            expect(sdkGeocodingError).toMatchObject(expectedSDKError);
        }
    );
});
