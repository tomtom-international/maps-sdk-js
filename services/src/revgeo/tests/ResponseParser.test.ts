import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseRevGeoResponse } from "../ResponseParser";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "../ReverseGeocoding";
import { ReverseGeocodingResponseAPI } from "../types/APITypes";

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
