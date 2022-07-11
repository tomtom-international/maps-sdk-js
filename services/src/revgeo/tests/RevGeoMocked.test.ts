import reverseGeocode from "../ReverseGeocoding";
import mockAxios from "jest-mock-axios";
import { example0APIResponse, example0SDKResponse } from "./RevGeoTest.data";

describe("Reverse Geocoding mocked tests", () => {
    test("Default reverse geocoding", async () => {
        mockAxios.get.mockResolvedValueOnce({
            status: 200,
            data: example0APIResponse
        });
        expect(await reverseGeocode({ position: [5.72884, 52.33499] })).toStrictEqual(example0SDKResponse);
    });
});
