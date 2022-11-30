import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import apiAndParsedResponses from "./RevGeoMocked.data.json";
import {ReverseGeocodingParams} from "../types/ReverseGeocodingParams";
import omit from "lodash/omit";

describe("Reverse Geocoding mock tests", () => {
    const axiosMock = new MockAdapter(axios);
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        async (_name: string, params: ReverseGeocodingParams, apiResponse: never, expectedParsedResponse: never) => {
            axiosMock.onGet().replyOnce(200, apiResponse);
            const response = await reverseGeocode(params);
            expect(omit(response, "id")).toStrictEqual(expectedParsedResponse);
            // (IDs are to be generated at random)
            expect(response.id).toBeTruthy();
            expect(response.id).toEqual(expect.any(String));
        }
    );

    test("Server response with 429.", async () => {
        axiosMock.onGet().replyOnce(429);
        await expect(reverseGeocode({position: [180, 90]})).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Too Many Requests: The API Key is over QPS (Queries per second)",
            status: 429
        });
    });
});
