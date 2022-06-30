import reverseGeocode from "../ReverseGeocoding";
import { setupFetchMock } from "../../shared/tests/FetchMockUtils";
import { example0APIResponse, example0SDKResponse } from "./RevGeoTest.data";

describe("Reverse Geocoding mocked tests", () => {
    const fetchMock = setupFetchMock();

    test("Default reverse geocoding", async () => {
        fetchMock.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(example0APIResponse)
            })
        );
        expect(await reverseGeocode({ position: [5.72884, 52.33499] })).toStrictEqual(example0SDKResponse);
    });
});
