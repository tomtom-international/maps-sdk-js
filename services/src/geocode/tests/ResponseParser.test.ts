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
        expect(parseGeocodingResponse(apiResponse0)).toMatchObject(sdkResponse0);
        expect(parseGeocodingResponse(apiResponse1)).toMatchObject(sdkResponse1);
    });
    test("mocked addressRanges", () => {
        expect(parseGeocodingResponse(apiResponse2)).toMatchObject(sdkResponse2);
    });
});
