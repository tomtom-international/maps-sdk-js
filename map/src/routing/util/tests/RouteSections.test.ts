import { FeatureCollection } from "geojson";
import { Routes } from "@anw/go-sdk-js/core";
import TEST_ROUTES_DATA from "./DummyRoutesWithSections.data.json";
import SECTIONS_WITH_SELECTION from "./RebuildSectionsWithSelection.data.json";
import { buildDisplayRouteSections, rebuildSectionsWithSelection } from "../RouteSections";
import { toDisplayTrafficSectionProps } from "../DisplayTrafficSectionProps";
import { DisplayRouteProps } from "../../types/DisplayRoutes";
import { RouteSections } from "../../types/RouteSections";

const TEST_ROUTES = TEST_ROUTES_DATA as Routes<DisplayRouteProps>;

const EMPTY_FEATURE_COLLECTION: FeatureCollection = {
    type: "FeatureCollection",
    features: []
};

const TEST_ID = "123";

describe("Tests about building route sections", () => {
    test("Build route sections", () => {
        expect(buildDisplayRouteSections(TEST_ROUTES, "carTrain")).toStrictEqual(EMPTY_FEATURE_COLLECTION);
        expect(buildDisplayRouteSections(TEST_ROUTES, "carTrain22" as never)).toStrictEqual(EMPTY_FEATURE_COLLECTION);
        expect(buildDisplayRouteSections(TEST_ROUTES, "ferry")).toStrictEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    id: TEST_ID,
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [0, 1],
                            [0, 2]
                        ]
                    },
                    properties: {
                        id: TEST_ID,
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
                    id: TEST_ID,
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 2,
                        endPointIndex: 3,
                        routeIndex: 1,
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
                    id: TEST_ID,
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [1, 3],
                            [1, 4]
                        ]
                    },
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 3,
                        endPointIndex: 5,
                        magnitudeOfDelay: "moderate",
                        delayInSeconds: 350,
                        tec: {
                            causes: [
                                {
                                    mainCauseCode: 19
                                }
                            ]
                        },
                        routeIndex: 1,
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
                    id: TEST_ID,
                    properties: {
                        id: TEST_ID,
                        startPointIndex: 3,
                        endPointIndex: 5,
                        magnitudeOfDelay: "moderate",
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
                        routeIndex: 1,
                        routeStyle: "deselected"
                    }
                }
            ]
        });
    });

    test.each(SECTIONS_WITH_SELECTION)(
        `'%s`,
        // @ts-ignore
        (_name: string, inputSections: RouteSections, expectedSections: RouteSections) => {
            expect(rebuildSectionsWithSelection(TEST_ROUTES, inputSections)).toStrictEqual(expectedSections);
        }
    );
});
