import { Routes } from "@anw/go-sdk-js/core";
import TEST_ROUTES_DATA from "./DummyRoutesWithSections.data.json";
import { buildDisplayRouteSections } from "../RouteSections";
import { FeatureCollection } from "geojson";
import { toDisplayTrafficSectionProps } from "../DisplayTrafficSectionProps";
import { DisplayRouteProps } from "../../types/DisplayRoutes";

const TEST_ROUTES = TEST_ROUTES_DATA as Routes<DisplayRouteProps>;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
    type: "FeatureCollection",
    features: []
};

describe("Tests to test building route sections", () => {
    test("Build route sections", () => {
        expect(buildDisplayRouteSections(TEST_ROUTES, "carTrain")).toStrictEqual(EMPTY_FEATURE_COLLECTION);
        expect(buildDisplayRouteSections(TEST_ROUTES, "carTrain22" as never)).toStrictEqual(EMPTY_FEATURE_COLLECTION);
        expect(buildDisplayRouteSections(TEST_ROUTES, "ferry")).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [0, 1],
                            [0, 2]
                        ]
                    },
                    properties: {
                        startPointIndex: 1,
                        endPointIndex: 3,
                        routeStyle: "selected"
                    }
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [[1, 2]]
                    },
                    properties: {
                        startPointIndex: 2,
                        endPointIndex: 3,
                        routeStyle: "deselected"
                    }
                }
            ]
        });

        // Traffic sections as-is:
        expect(buildDisplayRouteSections(TEST_ROUTES, "traffic")).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 3],
                            [1, 4]
                        ]
                    },
                    properties: {
                        startPointIndex: 3,
                        endPointIndex: 5,
                        magnitudeOfDelay: "MODERATE",
                        delayInSeconds: 350,
                        tec: {
                            causes: [
                                {
                                    mainCauseCode: 19
                                }
                            ]
                        },
                        routeStyle: "deselected"
                    }
                }
            ]
        });

        // Traffic section, passing its display props function:
        expect(buildDisplayRouteSections(TEST_ROUTES, "traffic", toDisplayTrafficSectionProps)).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 3],
                            [1, 4]
                        ]
                    },
                    properties: {
                        startPointIndex: 3,
                        endPointIndex: 5,
                        magnitudeOfDelay: "MODERATE",
                        delayInSeconds: 350,
                        tec: {
                            causes: [
                                {
                                    mainCauseCode: 19
                                }
                            ]
                        },
                        iconID: "traffic_queueing_weather_rain",
                        title: "6 min",
                        routeStyle: "deselected"
                    }
                }
            ]
        });
    });
});
