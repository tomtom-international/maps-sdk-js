import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
import errorResponses from "../../geocode/tests/ResponseParserError.data.json";
import { ErrorObjAPI, GeocodeAPIResponseError } from "../../shared/types/APIResponseErrorTypes";
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
        (apiResponseError: ErrorObjAPI<GeocodeAPIResponseError>) => {
            const sdkGeocodingError = geocodeResponseErrorParser(apiResponseError, "Geocode");
            expect(sdkGeocodingError.message).toEqual(apiResponseError.data.errorText);
        }
    );
});
