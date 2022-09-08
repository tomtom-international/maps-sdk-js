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

    test("vehicleMaxSpeed must be an integer in the range [0, 250]", async () => {
        axiosMock.onGet().replyOnce(400, {
            formatVersion: "0.0.12",
            error: {
                description: "Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]"
            },
            detailedError: {
                message: "Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]",
                code: "BAD_INPUT"
            }
        });
        await expect(
            calculateRoute({
                locations: [
                    [5.1352125, 52.3466513],
                    [4.898078, 52.3791283]
                ],
                vehicle: {
                    maxSpeedKMH: 251
                }
            })
        ).rejects.toMatchObject({
            service: "Routing",
            message: "Invalid value for vehicleMaxSpeed: 251. Value must be an integer in the range [0, 250]",
            status: 400
        });
    });

    test("No route found", async () => {
        axiosMock.onGet().replyOnce(400, {
            formatVersion: "0.0.12",
            error: {
                description:
                    "Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1"
            },
            detailedError: {
                message:
                    "Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1",
                code: "NO_ROUTE_FOUND"
            }
        });
        await expect(
            calculateRoute({
                locations: [
                    [7.630686, 47.0586103],
                    [7.59949, 47.04614],
                    [7.55595, 47.06]
                ]
            })
        ).rejects.toMatchObject({
            service: "Routing",
            message:
                "Engine error while executing route request: NO_ROUTE_FOUND: route search failed between origin and waypoint 1",
            status: 400
        });
    });
});
