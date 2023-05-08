import { Position } from "geojson";
import { Anything, Waypoint, WaypointProps } from "@anw/maps-sdk-js/core";
import { buildWaypointTitle, getImageIDForWaypoint, toDisplayWaypoints } from "../waypointUtils";
import { FINISH_INDEX, MIDDLE_INDEX, START_INDEX } from "../../types/waypointDisplayProps";
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID
} from "../../layers/waypointLayers";

const buildTestWaypoint = (properties: WaypointProps & Anything, coordinates: Position): Waypoint => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates
    },
    properties
});

describe("GeoInputs util tests", () => {
    test("Build waypoint title", () => {
        expect(buildWaypointTitle(null as never)).toBeUndefined();
        expect(buildWaypointTitle(buildTestWaypoint({}, [1, 2]))).toBeUndefined();
        expect(buildWaypointTitle(buildTestWaypoint({ address: {} }, [1, 2]))).toBeUndefined();
        expect(
            buildWaypointTitle({
                type: "Feature",
                geometry: { type: "Point", coordinates: [1, 2] },
                properties: { address: { freeformAddress: "ADDRESS" } }
            })
        ).toStrictEqual("ADDRESS");
        expect(buildWaypointTitle(buildTestWaypoint({ poi: { name: "POI" } }, [1, 2]))).toStrictEqual("POI");
        expect(
            buildWaypointTitle(
                buildTestWaypoint({ address: { freeformAddress: "ADDRESS" }, poi: { name: "POI" } }, [1, 2])
            )
        ).toStrictEqual("POI");
    });

    test("Get image ID for waypoint", () => {
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), START_INDEX)).toStrictEqual(
            WAYPOINT_START_IMAGE_ID
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), MIDDLE_INDEX)).toStrictEqual(
            WAYPOINT_STOP_IMAGE_ID
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), FINISH_INDEX)).toStrictEqual(
            WAYPOINT_FINISH_IMAGE_ID
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 0 }, [1, 2]), START_INDEX)).toStrictEqual(
            WAYPOINT_START_IMAGE_ID
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 1 }, [1, 2]), START_INDEX)).toStrictEqual(
            WAYPOINT_SOFT_IMAGE_ID
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 1 }, [1, 2]), MIDDLE_INDEX)).toStrictEqual(
            WAYPOINT_SOFT_IMAGE_ID
        );
    });

    test("To display waypoints", () => {
        expect(toDisplayWaypoints([])).toStrictEqual({ type: "FeatureCollection", features: [] });
        expect(toDisplayWaypoints([null])).toStrictEqual({ type: "FeatureCollection", features: [] });
        expect(toDisplayWaypoints([buildTestWaypoint({}, [1, 2])])).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [1, 2]
                    },
                    properties: {
                        index: 0,
                        indexType: START_INDEX,
                        iconID: WAYPOINT_START_IMAGE_ID
                    }
                }
            ]
        });
        expect(toDisplayWaypoints([null, buildTestWaypoint({}, [1, 2])])).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [1, 2]
                    },
                    properties: {
                        index: 1,
                        indexType: FINISH_INDEX,
                        iconID: WAYPOINT_FINISH_IMAGE_ID
                    }
                }
            ]
        });
        expect(toDisplayWaypoints([null, buildTestWaypoint({}, [1, 2]), null])).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [1, 2]
                    },
                    properties: {
                        index: 1,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 1
                    }
                }
            ]
        });
        expect(
            toDisplayWaypoints([
                buildTestWaypoint({ poi: { name: "POI" } }, [1, 2]),
                buildTestWaypoint({ radiusMeters: 25 }, [3, 4]),
                buildTestWaypoint({ address: { freeformAddress: "ADDRESS" } }, [5, 6]),
                [9, 10],
                { type: "Point", coordinates: [11, 12] },
                { ...buildTestWaypoint({ address: { freeformAddress: "ADDRESS2" } }, [13, 14]), bbox: [1, 2, 3, 4] }
            ])
        ).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [1, 2]
                    },
                    properties: {
                        poi: {
                            name: "POI"
                        },
                        index: 0,
                        indexType: START_INDEX,
                        iconID: WAYPOINT_START_IMAGE_ID,
                        title: "POI"
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [3, 4]
                    },
                    properties: {
                        radiusMeters: 25,
                        index: 1,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_SOFT_IMAGE_ID
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [5, 6]
                    },
                    properties: {
                        address: {
                            freeformAddress: "ADDRESS"
                        },
                        index: 2,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        title: "ADDRESS",
                        stopDisplayIndex: 1
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [9, 10]
                    },
                    properties: {
                        index: 3,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 2
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [11, 12]
                    },
                    properties: {
                        index: 4,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 3
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [13, 14]
                    },
                    properties: {
                        address: {
                            freeformAddress: "ADDRESS2"
                        },
                        index: 5,
                        indexType: FINISH_INDEX,
                        iconID: WAYPOINT_FINISH_IMAGE_ID,
                        title: "ADDRESS2"
                    },
                    bbox: [1, 2, 3, 4]
                }
            ]
        });
    });
});
