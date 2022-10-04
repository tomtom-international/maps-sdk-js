import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseGeocodingResponse } from "../ResponseParser";
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
