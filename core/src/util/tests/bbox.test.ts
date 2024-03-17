import type {
    Feature,
    FeatureCollection,
    GeometryCollection,
    LineString,
    MultiLineString,
    MultiPoint,
    MultiPolygon,
    Polygon,
    Position
} from "geojson";
import {
    bboxCenter,
    bboxExpandedWithBBox,
    bboxExpandedWithGeoJSON,
    bboxExpandedWithPosition,
    bboxFromBBoxes,
    bboxFromCoordsArray,
    bboxFromGeoJSON,
    bboxOnlyIfWithArea,
    isBBoxWithArea
} from "../bbox";

import { bestExecutionTimeMS } from "./performanceTestUtils";

describe("Bounding Box expansion functions", () => {
    test("Expand bounding box with position", () => {
        expect(bboxExpandedWithPosition(undefined as never)).toBeUndefined();
        expect(bboxExpandedWithPosition([])).toBeUndefined();
        expect(bboxExpandedWithPosition([20])).toBeUndefined();
        expect(bboxExpandedWithPosition([10, 20])).toEqual([10, 20, 10, 20]);
        expect(bboxExpandedWithPosition([10, 20], [0, 0, 1, 1])).toEqual([0, 0, 10, 20]);
        expect(bboxExpandedWithPosition([-10, -20], [0, 0, 1, 1])).toEqual([-10, -20, 1, 1]);
        expect(bboxExpandedWithPosition([-10, 20], [0, 0, 0, 0])).toEqual([-10, 0, 0, 20]);
        expect(bboxExpandedWithPosition([-10, 20], [-2, 1, 2, 3])).toEqual([-10, 1, 2, 20]);
        expect(bboxExpandedWithPosition([10, 5], [-20, -40, -10, -30])).toEqual([-20, -40, 10, 5]);
        expect(bboxExpandedWithPosition([-20, 5], [20, -40, 15, -30])).toEqual([-20, -40, 15, 5]);
    });

    test("Expand bounding box with another bounding box", () => {
        expect(bboxExpandedWithBBox(undefined, [1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(bboxExpandedWithBBox([0, 1, 2, 3])).toEqual([0, 1, 2, 3]);
        expect(bboxExpandedWithBBox([5, 6, 7, 8], [0, 0, 0, 0])).toEqual([0, 0, 7, 8]);
        expect(bboxExpandedWithBBox([5, 6, 7, 8], [10, 11, 0, 0])).toEqual([5, 6, 7, 8]);
        expect(bboxExpandedWithBBox([-10, -20, 30, 40], [-1, -2, 3, 4])).toEqual([-10, -20, 30, 40]);
    });

    test("Expand bounding box with any GeoJSON", () => {
        expect(
            bboxExpandedWithGeoJSON({
                type: "Feature",
                geometry: { type: "Point", coordinates: [10, 20] },
                properties: {}
            } as Feature)
        ).toEqual([10, 20, 10, 20]);
        expect(
            bboxExpandedWithGeoJSON(
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [10, 20] },
                    properties: {}
                } as Feature,
                [0, 0, 1, 2]
            )
        ).toEqual([0, 0, 10, 20]);
        expect(
            bboxExpandedWithGeoJSON(
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [10, 20] },
                    bbox: [-10, -20, 30, 40],
                    properties: {}
                } as Feature,
                [0, 0, 1, 2]
            )
        ).toEqual([-10, -20, 30, 40]);
    });
});

describe("Bounding box from other bounding boxes", () => {
    test("Bounding box from other bounding boxes", () => {
        expect(bboxFromBBoxes(undefined as never)).toBeUndefined();
        expect(bboxFromBBoxes([])).toBeUndefined();
        expect(bboxFromBBoxes([undefined])).toBeUndefined();
        expect(bboxFromBBoxes([[-10, -20, -5, -3]])).toEqual([-10, -20, -5, -3]);
        expect(
            bboxFromBBoxes([
                [10, 20, 50, 90],
                [0, 0, 0, 0, 20, 20],
                [0, -30, 110, 80]
            ])
        ).toEqual([0, -30, 110, 90]);
    });
});

describe("BBox size tests", () => {
    test("Does BBox have area", () => {
        expect(isBBoxWithArea(undefined)).toStrictEqual(false);
        expect(isBBoxWithArea([] as never)).toStrictEqual(false);
        expect(isBBoxWithArea([1] as never)).toStrictEqual(false);
        expect(isBBoxWithArea([1, 2, 1, 2])).toStrictEqual(false);
        expect(isBBoxWithArea([1, 3, 1, 2])).toStrictEqual(false);
        expect(isBBoxWithArea([1, 2, 2, 2, 3, 4])).toStrictEqual(false);
        expect(isBBoxWithArea([1, 20, 10, 1])).toStrictEqual(true);
        expect(isBBoxWithArea([1, 20, 10, 1, 2, 3])).toStrictEqual(true);
        expect(isBBoxWithArea([10, 2, 1, 20])).toStrictEqual(true);
        expect(isBBoxWithArea([-10, 2, 1, -20])).toStrictEqual(true);
        // (similar as above but with smaller differences):
        expect(isBBoxWithArea([1.12312, 2.12312, 1.12312, 2.12312])).toStrictEqual(false);
        expect(isBBoxWithArea([1.12314, 2.12312, 1.12312, 2.12312])).toStrictEqual(false);
        expect(isBBoxWithArea([1.12314, 2.12314, 1.12312, 2.12312])).toStrictEqual(true);
    });

    test("Get BBox only if it has area", () => {
        expect(bboxOnlyIfWithArea(undefined)).toBeUndefined();
        expect(bboxOnlyIfWithArea([1, 10, 1, 2])).toBeUndefined();
        expect(bboxOnlyIfWithArea([1, 10, 5, 1])).toEqual([1, 10, 5, 1]);
        // (further combinations should already be covered by internal "isBBoxWithArea" call tests)
    });
});

const buildTestDiagonal = (numPoints: number): Position[] => {
    const coordinates: Position[] = [];
    for (let i = 0; i < numPoints - 1; i++) {
        const progress = i / numPoints;
        coordinates.push([360 * progress - 180, 180 * progress - 90]);
    }
    coordinates.push([180, 90]);
    return coordinates;
};

describe("BBox from an array of coordinates", () => {
    test("BBox from an array of coordinates", () => {
        expect(bboxFromCoordsArray([])).toBeUndefined();
        expect(bboxFromCoordsArray(undefined)).toBeUndefined();
        expect(bboxFromCoordsArray([[0, 0]])).toEqual([0, 0, 0, 0]);
        expect(
            bboxFromCoordsArray([
                [0, 0],
                [0, 1],
                [0, 2]
            ])
        ).toEqual([0, 0, 0, 2]);
        expect(
            bboxFromCoordsArray([
                [-10, 0],
                [5, -15],
                [-20, 30]
            ])
        ).toEqual([-20, -15, 5, 30]);
    });

    test("Bounding box for long diagonals", () => {
        // This test ensures that the logic always considers the first and last points regardless of the line size
        // (we use a diagonal because in such case the first and last points are the ones ending up in the bbox)
        const expectedBBox = [-180, -90, 180, 90];
        expect(bboxFromCoordsArray(buildTestDiagonal(100))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(999))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(1000))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(1001))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(50000))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(99999))).toEqual(expectedBBox);
        expect(bboxFromCoordsArray(buildTestDiagonal(100001))).toEqual(expectedBBox);
    });
});

const geometryCollection: GeometryCollection = {
    type: "GeometryCollection",
    geometries: [
        undefined as never,
        {
            type: "Point",
            // (max lat here)
            bbox: [1, 2, 3, 80],
            coordinates: [4, 5]
        },
        {
            type: "UnsupportedType"
        } as never,
        {
            type: "Polygon",
            coordinates: [
                [
                    [4, 5],
                    // (min lon here)
                    [-10, 20],
                    [3, 2]
                ],
                [
                    // (max lon here)
                    [55, 2],
                    [4, 5]
                ]
            ]
        },
        {
            type: "LineString",
            coordinates: [
                [10, 10],
                [5, 2],
                // (min lat here)
                [0, -65]
            ]
        }
    ]
};

describe("Bounding box getter/calculator function", () => {
    test("Extracting bounding box for undefined or basic edge cases", () => {
        expect(bboxFromGeoJSON(undefined as never)).toBeUndefined();
        expect(bboxFromGeoJSON([] as never)).toBeUndefined();
        expect(bboxFromGeoJSON([1] as never)).toBeUndefined();
        expect(bboxFromGeoJSON([1, 2, 3] as never)).toBeUndefined();
    });

    test("Extracting bounding box when passing already a bbox", () => {
        expect(bboxFromGeoJSON([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        expect(bboxFromGeoJSON([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test("Extracting bounding box from single features and geometries that already have it", () => {
        expect(
            bboxFromGeoJSON({
                type: "Feature",
                bbox: [1, 2, 3, 4],
                geometry: { type: "Point", coordinates: [10, 20] },
                properties: {}
            } as Feature)
        ).toEqual([1, 2, 3, 4]);
        expect(
            bboxFromGeoJSON({
                type: "LineString",
                bbox: [1, 2, 3, 4],
                coordinates: []
            } as LineString)
        ).toEqual([1, 2, 3, 4]);
        expect(
            bboxFromGeoJSON({
                type: "FeatureCollection",
                bbox: [1, 2, 3, 4],
                features: [],
                properties: {}
            } as FeatureCollection)
        ).toEqual([1, 2, 3, 4]);
    });

    test(
        "Extracting bounding box from collections of features and geometries " +
            "that already have it in their elements",
        () => {
            expect(
                bboxFromGeoJSON({
                    type: "GeometryCollection",
                    geometries: [
                        { type: "Point", bbox: [0, -5, 10, 20], coordinates: [10, 20] },
                        { type: "LineString", bbox: [-10, 0, 5, 30], coordinates: [[10, 20]] }
                    ]
                } as GeometryCollection)
            ).toEqual([-10, -5, 10, 30]);
            expect(
                bboxFromGeoJSON({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: { type: "Point", bbox: [0, -5, 10, 20], coordinates: [10, 20] },
                            properties: {}
                        },
                        {
                            type: "Feature",
                            geometry: { type: "LineString", bbox: [-10, 0, 5, 30], coordinates: [[10, 20]] },
                            properties: {}
                        }
                    ],
                    properties: {}
                } as FeatureCollection)
            ).toEqual([-10, -5, 10, 30]);
        }
    );

    test("Calculating bounding box from single features and geometries that don't have it", () => {
        expect(
            bboxFromGeoJSON({
                type: "Feature",
                geometry: { type: "Point", coordinates: [10, 20] },
                properties: {}
            } as Feature)
        ).toEqual([10, 20, 10, 20]);
        expect(bboxFromGeoJSON({ type: "LineString", coordinates: [[0, 0]] } as LineString)).toEqual([0, 0, 0, 0]);
        expect(
            bboxFromGeoJSON({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [0, 0],
                        [3, 2],
                        [-1, 4]
                    ]
                }
            } as Feature)
        ).toEqual([-1, 0, 3, 4]);
        expect(
            bboxFromGeoJSON({
                type: "MultiPoint",
                coordinates: [
                    [0, 0],
                    [3, 2],
                    [-1, 4]
                ]
            } as MultiPoint)
        ).toEqual([-1, 0, 3, 4]);
        expect(
            bboxFromGeoJSON({
                type: "MultiLineString",
                coordinates: [
                    [
                        [0, 1],
                        [2, 3]
                    ],
                    [
                        [4, 5],
                        [-10, -2]
                    ]
                ]
            } as MultiLineString)
        ).toEqual([-10, -2, 4, 5]);
        expect(
            bboxFromGeoJSON({
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [0, 1],
                            [2, 3]
                        ],
                        [
                            [4, 5],
                            [-10, -2]
                        ]
                    ]
                }
            } as Feature)
        ).toEqual([-10, -2, 4, 5]);
        expect(
            bboxFromGeoJSON({
                type: "MultiPolygon",
                coordinates: [
                    [
                        [
                            [0, 1],
                            [2, 3]
                        ],
                        [
                            [4, 8],
                            [-10, -2]
                        ]
                    ],
                    [
                        [
                            [0, 1],
                            [-20, -3]
                        ],
                        [
                            [7, 5],
                            [-10, -2]
                        ]
                    ]
                ]
            } as MultiPolygon)
        ).toEqual([-20, -3, 7, 8]);
    });

    test("Calculating bounding box from complex geometry collection", () => {
        expect(bboxFromGeoJSON(geometryCollection)).toEqual([-10, -65, 55, 80]);
    });

    test("Calculating bounding box from complex feature collection", () => {
        expect(
            bboxFromGeoJSON({
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        // calculates [-10, -65, 55, 80]
                        geometry: geometryCollection
                    },
                    {
                        type: "Feature",
                        // (min lon here)
                        geometry: { type: "Point", coordinates: [-125, 20] },
                        properties: {}
                    }
                ],
                properties: {}
            } as FeatureCollection)
        ).toEqual([-125, -65, 55, 80]);
    });

    test("Bounding box from array of GeoJSON objects", () => {
        expect(bboxFromGeoJSON(undefined as never)).toBeUndefined();
        expect(bboxFromGeoJSON([])).toBeUndefined();
        expect(
            bboxFromGeoJSON([
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [20, -10]
                    },
                    properties: {}
                } as Feature
            ])
        ).toEqual([20, -10, 20, -10]);
        expect(
            bboxFromGeoJSON([
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        // (max lon here)
                        coordinates: [155, -10]
                    },
                    properties: {}
                } as Feature,
                // calculates [-10, -65, 55, 80]
                geometryCollection
            ])
        ).toEqual([-10, -65, 155, 80]);
    });
});

describe("Bounding box calculation performance tests", () => {
    test("Quick bounding box performance test for very long line", () => {
        const coordinates = buildTestDiagonal(100000);
        expect(bestExecutionTimeMS(() => bboxFromCoordsArray(coordinates), 20)).toBeLessThan(2);
    });

    test("Quick bounding box performance test for very long polygon", () => {
        const coordinates = buildTestDiagonal(200000);
        const polygon: Polygon = {
            type: "Polygon",
            // (we don't care if the shape is really polygon-correct here)
            coordinates: [coordinates, coordinates, coordinates, coordinates]
        };
        expect(bestExecutionTimeMS(() => bboxFromGeoJSON(polygon), 20)).toBeLessThan(2);
    });
});

describe("Bounding box center", () => {
    test("Calculate bounding box center", () => {
        expect(bboxCenter([2, 4, 6, 8])).toEqual([4, 6]);
    });
});
