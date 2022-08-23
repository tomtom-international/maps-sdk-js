import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { requestObjectsAndResponses } from "./RevGeoTest.data";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";

describe("Reverse Geocoding mock tests", () => {
    const axiosMock = new MockAdapter(axios);
    test.each(requestObjectsAndResponses)(
        `'%s`,
        // @ts-ignore
        async (name: string, params: ReverseGeocodingParams, apiResponse: never, sdkResponse: never) => {
            axiosMock.onGet().replyOnce(200, apiResponse);
            expect(await reverseGeocode(params)).toStrictEqual(sdkResponse);
        }
    );
});
