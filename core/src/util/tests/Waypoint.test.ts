import { asSoftWaypoint } from "../Waypoint";

describe("Waypoint utility tests", () => {
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
});
