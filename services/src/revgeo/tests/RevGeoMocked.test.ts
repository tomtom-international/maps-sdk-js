import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import apiAndParsedResponses from "./RevGeoTest.data.json";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";

describe("Reverse Geocoding mock tests", () => {
    const axiosMock = new MockAdapter(axios);
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        async (name: string, params: ReverseGeocodingParams, apiResponse: never, expectedParsedResponse: never) => {
            axiosMock.onGet().replyOnce(200, apiResponse);
            expect(await reverseGeocode(params)).toStrictEqual(expectedParsedResponse);
        }
    );
});
