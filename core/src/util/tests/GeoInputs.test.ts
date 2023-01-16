import { asSoftWaypoint, getGeoInputType } from "../GeoInputs";
import { Route } from "../../types";

describe("GeoInputs utility tests", () => {
    test("As soft waypoint tests", () => {
        expect(asSoftWaypoint([10, 20], 30)).toStrictEqual({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [10, 20]
            },
            properties: {
                radiusMeters: 30
            }
        });

        expect(
            asSoftWaypoint(
                {
                    type: "Point",
                    coordinates: [10, 20]
                },
                30
            )
        ).toStrictEqual({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [10, 20]
            },
            properties: {
                radiusMeters: 30
            }
        });

        expect(
            asSoftWaypoint(
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [10, 20]
                    },
                    properties: {
                        address: {
                            freeFormAddress: "test_address"
                        },
                        // to be overwritten by radius parameter below:
                        radiusMeters: 15
                    },
                    bbox: [1, 2, 3, 4]
                },
                30
            )
        ).toStrictEqual({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [10, 20]
            },
            properties: {
                address: {
                    freeFormAddress: "test_address"
                },
                radiusMeters: 30
            },
            bbox: [1, 2, 3, 4]
        });
    });

    test("getGeoInputType tests", () => {
        expect(getGeoInputType([3, 4])).toStrictEqual("waypoint");
        expect(getGeoInputType([[3, 4]])).toStrictEqual("path");
        expect(
            getGeoInputType([
                [0, 1],
                [3, 4]
            ])
        ).toStrictEqual("path");
        expect(getGeoInputType({ type: "Point", coordinates: [0, 1] })).toStrictEqual("waypoint");
        expect(
            getGeoInputType({ type: "Feature", geometry: { type: "Point", coordinates: [0, 1] }, properties: {} })
        ).toStrictEqual("waypoint");
        expect(
            getGeoInputType({
                type: "Feature",
                geometry: { type: "LineString", coordinates: [[0, 1]] },
                properties: {}
            } as Route)
        ).toStrictEqual("path");
    });
});
