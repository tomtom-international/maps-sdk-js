import {
    APIResponse0,
    SDKResponse0,
    APIResponse1,
    SDKResponse1,
    APIResponse2,
    SDKResponse2
} from "./ResponseParser.data";
import { parseGeocodingResponse } from "../ResponseParser";

describe("Geocode response parsing tests", () => {
    test("parsing actual API responses", () => {
        expect(parseGeocodingResponse(null as any, APIResponse0)).toMatchObject(SDKResponse0);
        expect(parseGeocodingResponse(null as any, APIResponse1)).toMatchObject(SDKResponse1);
    });
    test("mocked addressRanges", () => {
        expect(parseGeocodingResponse(null as any, APIResponse2)).toMatchObject(SDKResponse2);
    });
});
