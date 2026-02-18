import { describe, expect, test } from 'vitest';
import type { Route, SectionProps, WaypointLike } from '../../types';
import { findBestWaypointInsertionIndex, getSectionBBox, withInsertedWaypoint } from '../route';

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
