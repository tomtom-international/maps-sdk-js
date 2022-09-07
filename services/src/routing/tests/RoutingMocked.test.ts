import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { calculateRoute } from "../CalculateRoute";

describe("Routing mock tests", () => {
    const axiosMock = new MockAdapter(axios);
    test("Route requests with routeType=thrilling for distances over 900km", async () => {
        axiosMock.onGet().replyOnce(400, {
            formatVersion: "0.0.12",
            error: {
                description: "Route requests with routeType=thrilling for distances over 900km are not supported."
            },
            detailedError: {
                message: "Route requests with routeType=thrilling for distances over 900km are not supported.",
                code: "BAD_INPUT"
            }
        });
        await expect(
            calculateRoute({
                locations: [
                    [21.561363, 65.434796],
                    [4.898078, 52.3791283]
                ],
                routeType: "thrilling"
            })
        ).rejects.toThrow("Route requests with routeType=thrilling for distances over 900km are not supported.");
    });
});
