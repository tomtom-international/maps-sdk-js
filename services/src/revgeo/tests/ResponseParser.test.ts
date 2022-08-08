import { apiAndParsedResponses } from "./ResponseParser.data";
import { parseRevGeoResponse } from "../ResponseParser";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "../ReverseGeocoding";

describe("ReverseGeocode response parsing tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        (
            name: string,
            params: ReverseGeocodingParams,
            apiResponse: any,
            expectedParsedResponse: ReverseGeocodingResponse
        ) => {
            expect(parseRevGeoResponse(apiResponse, params)).toStrictEqual(expectedParsedResponse);
        }
    );
});
