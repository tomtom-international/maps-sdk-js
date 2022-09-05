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

    test("Position is missing", async () => {
        axiosMock.onGet().replyOnce(400, {
            error: "Invalid request: position is missing",
            httpStatusCode: 400,
            detailedError: {
                code: "BadRequest",
                message: "Invalid request: position is missing",
                target: "position"
            }
        });
        await expect(reverseGeocode({ position: [] })).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Invalid request: position is missing",
            status: 400
        });
    });

    test("Invalid position: cannot parse position.", async () => {
        axiosMock.onGet().replyOnce(400, {
            error: "Invalid request: invalid position: cannot parse position.",
            httpStatusCode: 400,
            detailedError: {
                code: "BadRequest",
                message: "Invalid request: invalid position: cannot parse position.",
                target: "position"
            }
        });
        await expect(reverseGeocode({ position: [47.06] })).rejects.toMatchObject({
            service: "ReverseGeocode",
            message: "Invalid request: invalid position: cannot parse position.",
            status: 400
        });
    });

    test("Invalid language parameter", async () => {
        axiosMock.onGet().replyOnce(400, {
            error: "Invalid request: invalid language parameter: [ ]",
            httpStatusCode: 400,
            detailedError: {
                code: "BadRequest",
                message: "Invalid request: invalid language parameter: [ ]",
                target: "language"
            }
        });
        await expect(
            reverseGeocode({
                position: [23, 47.06],
                language: " "
            })
        ).rejects.toThrow("Invalid request: invalid language parameter: [ ]");
    });

    test("Invalid position: latitude/longitude out of range.", async () => {
        axiosMock.onGet().replyOnce(400, {
            error: "Invalid request: invalid position: latitude/longitude out of range.",
            httpStatusCode: 400,
            detailedError: {
                code: "BadRequest",
                message: "Invalid request: invalid position: latitude/longitude out of range.",
                target: "position"
            }
        });
        await expect(
            reverseGeocode({
                position: [180, -90]
            })
        ).rejects.toThrow("Invalid request: invalid position: latitude/longitude out of range.");
    });
});
