import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import geocoding from "../Geocoding";

describe("Reverse Geocoding mock tests", () => {
    const axiosMock = new MockAdapter(axios);

    test("Empty query", async () => {
        axiosMock.onGet().replyOnce(400, {
            errorText: "Empty query allowed only with the filters provided or in wildcard context.",
            detailedError: {
                code: "BadRequest",
                message: "Empty query allowed only with the filters provided or in wildcard context."
            },
            httpStatusCode: 400
        });
        await expect(geocoding({ query: "" })).rejects.toThrow(
            "Empty query allowed only with the filters provided or in wildcard context."
        );
    });

    test("Incorrect Language Code", async () => {
        axiosMock.onGet().replyOnce(400, {
            errorText: "Error parsing 'language': Language tag 'XYZ' not supported",
            detailedError: {
                code: "BadRequest",
                message: "Error parsing 'language': Language tag 'XYZ' not supported",
                target: "language"
            },
            httpStatusCode: 400
        });
        await expect(geocoding({ query: "ams", language: "XYZ" })).rejects.toThrow(
            "Error parsing 'language': Language tag 'XYZ' not supported"
        );
    });
});
