import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { example0APIResponse, example0SDKResponse } from "./RevGeoTest.data";

describe("Reverse Geocoding mocked tests", () => {
    const axiosMock = new MockAdapter(axios);

    test("Default reverse geocoding", async () => {
        axiosMock.onGet().replyOnce(200, example0APIResponse);
        expect(await reverseGeocode({ position: [5.72884, 52.33499] })).toStrictEqual(example0SDKResponse);
    });
});
