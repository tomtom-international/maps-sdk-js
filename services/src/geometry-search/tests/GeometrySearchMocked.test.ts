import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import geometrySearch from "../GeometrySearch";

describe("Reverse GeometrySearch mock tests", () => {
    const axiosMock = new MockAdapter(axios);

    test("it should parse error response", async () => {
        axiosMock.onPost().reply(400, {
            errorText: "Error parsing 'openingHours': Not supported openingHours mode",
            detailedError: {
                code: "BadRequest",
                message: "Error parsing 'openingHours': Not supported openingHours mode",
                target: "openingHours"
            },
            httpStatusCode: 400
        });

        await expect(geometrySearch({ query: "cafe", geometries: [] })).rejects.toThrow(
            "Error parsing 'openingHours': Not supported openingHours mode"
        );
    });
});
