import {
    apiResponse0,
    sdkResponse0,
    apiResponse1,
    sdkResponse1,
    apiResponse2,
    sdkResponse2
} from "./ResponseParser.data";
import { parseGeocodingResponse } from "../ResponseParser";

describe("Geocode response parsing tests", () => {
    test("parsing actual API responses", () => {
        expect(parseGeocodingResponse(apiResponse0)).toStrictEqual(sdkResponse0);
        expect(parseGeocodingResponse(apiResponse1)).toStrictEqual(sdkResponse1);
    });
    test("mocked addressRanges", () => {
        expect(parseGeocodingResponse(apiResponse2)).toStrictEqual(sdkResponse2);
    });
});
