import { describe, expect, test } from 'vitest';
import type { Route, RouteProgressPoint, SectionProps, WaypointLike } from '../../types';
import {
    findBestWaypointInsertionIndex,
    getRouteProgressBetween,
    getSectionBBox,
    interpolateProgressAtIndex,
    withInsertedWaypoint,
} from '../route';

// Factory that builds a straight east-going path with pointCount stops:
// index 0 → [0, 0], index 1 → [1, 0], index 2 → [2, 0], …
// This keeps coordinate values identical to their index, making the
// interpolation maths trivially easy to verify by hand.
const makeSimpleRoute = (pointCount: number, progress: RouteProgressPoint[]): Route => ({
    type: 'Feature',
    id: 'route',
    geometry: {
        type: 'LineString',
        coordinates: Array.from({ length: pointCount }, (_, i) => [i, 0]),
    },
    properties: { summary: {} as any, sections: {} as any, index: 0, progress },
    bbox: [0, 0, pointCount - 1, 0],
});

// Shared 5-coordinate route factory used by the progress tests.
const makeProgressRoute = (progress?: RouteProgressPoint[]): Route => ({
    type: 'Feature',
    id: 'route-1',
    geometry: {
        type: 'LineString',
        coordinates: [
            [4.9, 52.3], // 0
            [4.91, 52.31], // 1
            [4.92, 52.32], // 2
            [4.93, 52.33], // 3
            [4.94, 52.34], // 4
        ],
    },
    properties: {
        summary: {} as any,
        sections: {} as any,
        index: 0,
        progress,
    },
    bbox: [4.9, 52.3, 4.94, 52.34],
});

describe('interpolateProgressAtIndex', () => {
    test('returns undefined when progress is missing', () => {
        expect(interpolateProgressAtIndex(makeProgressRoute(), 2)).toBeUndefined();
    });

    test('returns undefined when progress is empty', () => {
        expect(interpolateProgressAtIndex(makeProgressRoute([]), 2)).toBeUndefined();
    });

    test('returns undefined for negative path index', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, -1)).toBeUndefined();
    });

    test('returns undefined for path index beyond coordinate array', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 5)).toBeUndefined();
    });

    test('returns exact values at the first progress point', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 0)).toEqual({ distanceInMeters: 0, travelTimeInSeconds: 0 });
    });

    test('returns exact values at the last progress point', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 4)).toEqual({
            distanceInMeters: 1000,
            travelTimeInSeconds: 120,
        });
    });

    test('returns exact values at an intermediate progress point', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 2, distanceInMeters: 400, travelTimeInSeconds: 50 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 2)).toEqual({
            distanceInMeters: 400,
            travelTimeInSeconds: 50,
        });
    });

    test('linearly interpolates at the midpoint', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        // ratio = 2/4 = 0.5
        expect(interpolateProgressAtIndex(route, 2)).toEqual({
            distanceInMeters: 500,
            travelTimeInSeconds: 60,
        });
    });

    test('linearly interpolates between intermediate progress points', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 2, distanceInMeters: 400, travelTimeInSeconds: 50 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        // ratio = (3 - 2) / (4 - 2) = 0.5
        // dist = 400 + 0.5 * 600 = 700,  time = 50 + 0.5 * 70 = 85
        expect(interpolateProgressAtIndex(route, 3)).toEqual({
            distanceInMeters: 700,
            travelTimeInSeconds: 85,
        });
    });

    test('returns undefined when a progress point is missing distance or time values', () => {
        const route = makeProgressRoute([
            { pointIndex: 0 }, // no distanceInMeters / travelTimeInSeconds
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 2)).toBeUndefined();
    });

    test('returns undefined when path index is before the first progress entry', () => {
        const route = makeProgressRoute([
            { pointIndex: 1, distanceInMeters: 100, travelTimeInSeconds: 10 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 0)).toBeUndefined();
    });

    test('returns undefined when path index is after the last progress entry', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 3, distanceInMeters: 800, travelTimeInSeconds: 90 },
        ]);
        expect(interpolateProgressAtIndex(route, 4)).toBeUndefined();
    });

    // --- simple straight-path scenarios (coordinates = [index, 0]) ---

    test('single-point route — returns progress at the only coordinate', () => {
        // Path:  [0,0]
        // Progress: index 0 → 0 m, 0 s
        const route = makeSimpleRoute(1, [{ pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 }]);
        expect(interpolateProgressAtIndex(route, 0)).toEqual({ distanceInMeters: 0, travelTimeInSeconds: 0 });
    });

    test('dense progress — exact match on every coordinate, no interpolation occurs', () => {
        // Path:  [0,0] → [1,0] → [2,0]
        // Progress at every index — querying index 1 must return the stored value, not an interpolated one.
        const route = makeSimpleRoute(3, [
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 1, distanceInMeters: 250, travelTimeInSeconds: 25 },
            { pointIndex: 2, distanceInMeters: 700, travelTimeInSeconds: 60 },
        ]);
        expect(interpolateProgressAtIndex(route, 1)).toEqual({ distanceInMeters: 250, travelTimeInSeconds: 25 });
    });

    test('sparse progress — interpolates across a wide gap between two entries', () => {
        // Path:  [0,0] → [1,0] → [2,0] → [3,0] → [4,0] → [5,0] → [6,0]  (7 points)
        // Progress only at the endpoints.
        // Query at index 2:  ratio = 2/6 = 1/3  →  200 m, 40 s
        const route = makeSimpleRoute(7, [
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 6, distanceInMeters: 600, travelTimeInSeconds: 120 },
        ]);
        expect(interpolateProgressAtIndex(route, 2)).toEqual({ distanceInMeters: 200, travelTimeInSeconds: 40 });
    });

    test('non-zero cumulative start — interpolates correctly when route begins mid-journey', () => {
        // Path:  [0,0] → [1,0] → [2,0] → [3,0] → [4,0]  (5 points)
        // Progress starts at a non-zero offset (e.g. this is a leg of a longer trip).
        // Query at index 2:  ratio = 2/4 = 0.5  →  3250 m, 225 s
        const route = makeSimpleRoute(5, [
            { pointIndex: 0, distanceInMeters: 3000, travelTimeInSeconds: 200 },
            { pointIndex: 4, distanceInMeters: 3500, travelTimeInSeconds: 250 },
        ]);
        expect(interpolateProgressAtIndex(route, 2)).toEqual({ distanceInMeters: 3250, travelTimeInSeconds: 225 });
    });

    test('asymmetric progress coverage — interpolates only within the bracketing segment', () => {
        // Path:  [0,0] → [1,0] → [2,0] → [3,0] → [4,0]  (5 points)
        // Progress at indices 0, 1, and 4 — the second segment [1..4] is much longer.
        // Query at index 3:  ratio = (3-1)/(4-1) = 2/3
        //   dist = 100 + 2/3 * (700 - 100) = 100 + 400 = 500 m
        //   time = 10  + 2/3 * (70  - 10)  = 10  + 40  = 50 s
        const route = makeSimpleRoute(5, [
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 1, distanceInMeters: 100, travelTimeInSeconds: 10 },
            { pointIndex: 4, distanceInMeters: 700, travelTimeInSeconds: 70 },
        ]);
        expect(interpolateProgressAtIndex(route, 3)).toEqual({ distanceInMeters: 500, travelTimeInSeconds: 50 });
    });

    test('progress not starting at index 0 — returns undefined for indices before first entry', () => {
        // Path:  [0,0] → [1,0] → [2,0] → [3,0] → [4,0]
        // Progress begins at index 2; indices 0 and 1 have no coverage.
        const route = makeSimpleRoute(5, [
            { pointIndex: 2, distanceInMeters: 200, travelTimeInSeconds: 20 },
            { pointIndex: 4, distanceInMeters: 600, travelTimeInSeconds: 60 },
        ]);
        expect(interpolateProgressAtIndex(route, 0)).toBeUndefined();
        expect(interpolateProgressAtIndex(route, 1)).toBeUndefined();
        // Index 2 is covered — exact match.
        expect(interpolateProgressAtIndex(route, 2)).toEqual({ distanceInMeters: 200, travelTimeInSeconds: 20 });
    });
});

describe('getRouteProgressBetween', () => {
    test('returns undefined when progress is missing', () => {
        expect(getRouteProgressBetween(makeProgressRoute(), 0, 4)).toBeUndefined();
    });

    test('returns start, end, and delta for the full route', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(getRouteProgressBetween(route, 0, 4)).toEqual({
            start: { distanceInMeters: 0, travelTimeInSeconds: 0 },
            end: { distanceInMeters: 1000, travelTimeInSeconds: 120 },
            delta: { distanceInMeters: 1000, travelTimeInSeconds: 120 },
        });
    });

    test('computes correct delta for a mid-segment', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        // start index 1 → ratio 1/4 → 250 m, 30 s
        // end   index 3 → ratio 3/4 → 750 m, 90 s
        // delta              → 500 m, 60 s
        const result = getRouteProgressBetween(route, 1, 3);
        expect(result?.start).toEqual({ distanceInMeters: 250, travelTimeInSeconds: 30 });
        expect(result?.end).toEqual({ distanceInMeters: 750, travelTimeInSeconds: 90 });
        expect(result?.delta).toEqual({ distanceInMeters: 500, travelTimeInSeconds: 60 });
    });

    test('returns undefined when start index is invalid', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(getRouteProgressBetween(route, -1, 4)).toBeUndefined();
    });

    test('returns undefined when end index is invalid', () => {
        const route = makeProgressRoute([
            { pointIndex: 0, distanceInMeters: 0, travelTimeInSeconds: 0 },
            { pointIndex: 4, distanceInMeters: 1000, travelTimeInSeconds: 120 },
        ]);
        expect(getRouteProgressBetween(route, 0, 10)).toBeUndefined();
    });
});

describe('route utility tests', () => {
    test('findBestWaypointInsertionIndex - insert between two waypoints', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3], // origin
            [5.0, 52.4], // destination
        ];

        const newWaypoint: WaypointLike = [4.95, 52.35];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(1); // Should insert between origin and destination
    });

    test('findBestWaypointInsertionIndex - insert at beginning', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.85, 52.25],
                    [4.9, 52.3],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.85, 52.25, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
        ];

        const newWaypoint: WaypointLike = [4.85, 52.25];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(0); // Should insert at the beginning
    });

    test('findBestWaypointInsertionIndex - insert at end', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [5.0, 52.4],
                    [5.1, 52.5],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.1, 52.5],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
        ];

        const newWaypoint: WaypointLike = [5.1, 52.5];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(2); // Should insert at the end
    });

    test('findBestWaypointInsertionIndex - insert in middle of three waypoints', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                    [5.1, 52.5],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.1, 52.5],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
            [5.1, 52.5],
        ];

        const newWaypoint: WaypointLike = [4.95, 52.35];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(1); // Should insert between first and second waypoint
    });

    test('findBestWaypointInsertionIndex - empty route returns 0', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [0, 0, 0, 0],
        };

        const existingWaypoints: WaypointLike[] = [[4.9, 52.3]];
        const newWaypoint: WaypointLike = [5.0, 52.4];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(0);
    });

    test('findBestWaypointInsertionIndex - less than 2 waypoints returns 0', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [[4.9, 52.3]];
        const newWaypoint: WaypointLike = [5.0, 52.4];

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(0);
    });

    test('findBestWaypointInsertionIndex - works with Feature waypoints', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [4.9, 52.3] },
                properties: {},
            },
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [5.0, 52.4] },
                properties: {},
            },
        ];

        const newWaypoint: WaypointLike = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [4.95, 52.35] },
            properties: {},
        };

        const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
        expect(insertIndex).toBe(1); // Should insert between origin and destination
    });

    test('withInsertedWaypoint - inserts waypoint between two waypoints', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
        ];

        const newWaypoint: WaypointLike = [4.95, 52.35];

        const result = withInsertedWaypoint(route, existingWaypoints, newWaypoint);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual([4.9, 52.3]);
        expect(result[1]).toEqual([4.95, 52.35]);
        expect(result[2]).toEqual([5.0, 52.4]);
        expect(existingWaypoints).toHaveLength(2); // Original array unchanged
    });

    test('withInsertedWaypoint - inserts at beginning', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.85, 52.25],
                    [4.9, 52.3],
                    [5.0, 52.4],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.85, 52.25, 5.0, 52.4],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
        ];

        const newWaypoint: WaypointLike = [4.85, 52.25];

        const result = withInsertedWaypoint(route, existingWaypoints, newWaypoint);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual([4.85, 52.25]);
        expect(result[1]).toEqual([4.9, 52.3]);
        expect(result[2]).toEqual([5.0, 52.4]);
    });

    test('withInsertedWaypoint - inserts at end', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [5.0, 52.4],
                    [5.1, 52.5],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.1, 52.5],
        };

        const existingWaypoints: WaypointLike[] = [
            [4.9, 52.3],
            [5.0, 52.4],
        ];

        const newWaypoint: WaypointLike = [5.1, 52.5];

        const result = withInsertedWaypoint(route, existingWaypoints, newWaypoint);

        expect(result).toHaveLength(3);
        expect(result[0]).toEqual([4.9, 52.3]);
        expect(result[1]).toEqual([5.0, 52.4]);
        expect(result[2]).toEqual([5.1, 52.5]);
    });

    test('getSectionBBox - calculates bbox for section', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                    [5.1, 52.5],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.1, 52.5],
        };

        const section: SectionProps = {
            id: 'section-1',
            startPointIndex: 0,
            endPointIndex: 3,
        };

        const bbox = getSectionBBox(route, section);

        expect(bbox).toBeDefined();
        expect(bbox).toEqual([4.9, 52.3, 5.1, 52.5]);
    });

    test('getSectionBBox - calculates bbox for partial section', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                    [5.0, 52.4],
                    [5.1, 52.5],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 5.1, 52.5],
        };

        const section: SectionProps = {
            id: 'section-1',
            startPointIndex: 1,
            endPointIndex: 2,
        };

        const bbox = getSectionBBox(route, section);

        expect(bbox).toBeDefined();
        expect(bbox).toEqual([4.95, 52.35, 5.0, 52.4]);
    });

    test('getSectionBBox - returns undefined for invalid section', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 4.95, 52.35],
        };

        const section: SectionProps = {
            id: 'section-1',
            startPointIndex: 0,
            endPointIndex: 10, // Invalid: beyond route coordinates
        };

        const bbox = getSectionBBox(route, section);

        expect(bbox).toBeUndefined();
    });

    test('getSectionBBox - returns undefined for empty route', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [0, 0, 0, 0],
        };

        const section: SectionProps = {
            id: 'section-1',
            startPointIndex: 0,
            endPointIndex: 1,
        };

        const bbox = getSectionBBox(route, section);

        expect(bbox).toBeUndefined();
    });

    test('getSectionBBox - handles single point section', () => {
        const route: Route = {
            type: 'Feature',
            id: 'route-1',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [4.9, 52.3],
                    [4.95, 52.35],
                ],
            },
            properties: {
                summary: {} as any,
                sections: {} as any,
                index: 0,
            },
            bbox: [4.9, 52.3, 4.95, 52.35],
        };

        const section: SectionProps = {
            id: 'section-1',
            startPointIndex: 0,
            endPointIndex: 0, // Same start and end
        };

        const bbox = getSectionBBox(route, section);

        expect(bbox).toBeDefined();
        expect(bbox).toEqual([4.9, 52.3, 4.9, 52.3]); // Point bbox
    });
});
