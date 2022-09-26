import { Position } from "geojson";
import {
    bboxExpandedWithBBox,
    bboxExpandedWithPointFeature,
    bboxExpandedWithPosition,
    bboxFromBBoxes,
    bboxFromPointFeatures,
    bboxOnlyIfWithArea,
    isBBoxWithArea,
    quickBBoxFromCoordsArray,
    quickBBoxFromLineString
} from "../BBox";

describe("Bounding Box expansion functions", () => {
    test("Expand bounding box with position", () => {
        expect(bboxExpandedWithPosition([10, 20])).toEqual([10, 20, 10, 20]);
        expect(bboxExpandedWithPosition([10, 20], [0, 0, 1, 1])).toEqual([0, 0, 10, 20]);
        expect(bboxExpandedWithPosition([-10, -20], [0, 0, 1, 1])).toEqual([-10, -20, 1, 1]);
        expect(bboxExpandedWithPosition([-10, 20], [0, 0, 0, 0])).toEqual([-10, 0, 0, 20]);
        expect(bboxExpandedWithPosition([-10, 20], [-2, 1, 2, 3])).toEqual([-10, 1, 2, 20]);
        expect(bboxExpandedWithPosition([10, 5], [-20, -40, -10, -30])).toEqual([-20, -40, 10, 5]);
        expect(bboxExpandedWithPosition([-20, 5], [20, -40, 15, -30])).toEqual([-20, -40, 15, 5]);
    });

    test("Expand bounding box with another bounding box", () => {
        expect(bboxExpandedWithBBox([0, 1, 2, 3])).toEqual([0, 1, 2, 3]);
        expect(bboxExpandedWithBBox([5, 6, 7, 8], [0, 0, 0, 0])).toEqual([0, 0, 7, 8]);
        expect(bboxExpandedWithBBox([5, 6, 7, 8], [10, 11, 0, 0])).toEqual([5, 6, 7, 8]);
        expect(bboxExpandedWithBBox([-10, -20, 30, 40], [-1, -2, 3, 4])).toEqual([-10, -20, 30, 40]);
    });

    test("Expand bounding box with point feature", () => {
        expect(
            bboxExpandedWithPointFeature({
                type: "Feature",
                geometry: { type: "Point", coordinates: [10, 20] },
                properties: {}
            })
        ).toEqual([10, 20, 10, 20]);
        expect(
            bboxExpandedWithPointFeature(
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [10, 20] },
                    properties: {}
                },
                [0, 0, 1, 2]
            )
        ).toEqual([0, 0, 10, 20]);
        expect(
            bboxExpandedWithPointFeature(
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [10, 20] },
                    bbox: [-10, -20, 30, 40],
                    properties: {}
                },
                [0, 0, 1, 2]
            )
        ).toEqual([-10, -20, 30, 40]);
    });
});

describe("BBox calculations from various inputs", () => {
    test("Bounding box from point features", () => {
        expect(bboxFromPointFeatures([])).toBeUndefined();
        expect(
            bboxFromPointFeatures([
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [20, -10]
                    },
                    properties: {}
                }
            ])
        ).toEqual([20, -10, 20, -10]);
        expect(
            bboxFromPointFeatures([
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [20, -10]
                    },
                    properties: {}
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-20, 30]
                    },
                    properties: {}
                }
            ])
        ).toEqual([-20, -10, 20, 30]);
        expect(
            bboxFromPointFeatures([
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [0, 0]
                    },
                    bbox: [-50, -20, 30, 40],
                    properties: {}
                },
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [-20, 50]
                    },
                    properties: {}
                }
            ])
        ).toEqual([-50, -20, 30, 50]);
    });

    test("Bounding box from other bounding boxes", () => {
        expect(
            bboxFromBBoxes([
                [-10, -20, -5, -3],
                [-1, -30, 5, 10]
            ])
        ).toEqual([-10, -30, 5, 10]);
        expect(
            bboxFromBBoxes([
                [10, 20, 50, 90],
                [0, 0, 0, 0],
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

describe("Quick bbox from a line", () => {
    test("Quick bounding box for short lines", () => {
        expect(quickBBoxFromCoordsArray([])).toBeUndefined();
        expect(quickBBoxFromCoordsArray(undefined)).toBeUndefined();
        expect(quickBBoxFromCoordsArray([[0, 0]])).toEqual([0, 0, 0, 0]);
        expect(
            quickBBoxFromCoordsArray([
                [0, 0],
                [0, 1],
                [0, 2]
            ])
        ).toEqual([0, 0, 0, 2]);
        expect(
            quickBBoxFromCoordsArray([
                [-10, 0],
                [5, -15],
                [-20, 30]
            ])
        ).toEqual([-20, -15, 5, 30]);
    });

    test("Quick bounding box for LineString", () => {
        expect(quickBBoxFromLineString(undefined)).toBeUndefined();
        expect(quickBBoxFromLineString({ type: "LineString", coordinates: [[0, 0]] })).toEqual([0, 0, 0, 0]);
        expect(
            quickBBoxFromLineString({
                type: "LineString",
                coordinates: [
                    [0, 0],
                    [1, 2]
                ]
            })
        ).toEqual([0, 0, 1, 2]);
    });

    test("Quick bounding box for long diagonals", () => {
        // This test ensures that the logic always considers the first and last points regardless of the line size
        // (we use a diagonal because in such case the first and last points are the ones ending up in the bbox)
        const expectedBBox = [-180, -90, 180, 90];
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(100))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(999))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(1000))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(1001))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(50000))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(99999))).toEqual(expectedBBox);
        expect(quickBBoxFromCoordsArray(buildTestDiagonal(100001))).toEqual(expectedBBox);
    });
});

describe("Bounding box calculation performance tests", () => {
    test("Quick bounding box performance test for very long line", () => {
        const coordinates = buildTestDiagonal(100000);
        const numExecutions = 20;
        const accExecTimes = [];
        for (let i = 0; i < numExecutions; i++) {
            const start = performance.now();
            quickBBoxFromCoordsArray(coordinates);
            accExecTimes.push(performance.now() - start);
        }
        expect(Math.min.apply(null, accExecTimes)).toBeLessThan(1);
    });
});
