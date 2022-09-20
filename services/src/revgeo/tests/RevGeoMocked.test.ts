import reverseGeocode from "../ReverseGeocoding";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import apiAndParsedResponses from "./RevGeoMocked.data.json";
import { ReverseGeocodingParams } from "../types/ReverseGeocodingParams";

describe("Reverse Geocoding mock tests", () => {
    const axiosMock = new MockAdapter(axios);
    test.each(apiAndParsedResponses)(
        `'%s`,
        // @ts-ignore
        async (_name: string, params: ReverseGeocodingParams, apiResponse: never, expectedParsedResponse: never) => {
            axiosMock.onGet().replyOnce(200, apiResponse);
            expect(await reverseGeocode(params)).toStrictEqual(expectedParsedResponse);
        }
    );

    test("Server response with 429.", async () => {
        axiosMock.onGet().replyOnce(429);
        await expect(reverseGeocode({ position: [-232, -22] })).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Too Many Requests: The API Key is over QPS (Queries per second)",
            status: 429
        });
    });
});
