import type { Anything, Waypoint, WaypointProps } from '@cet/maps-sdk-js/core';
import type { Position } from 'geojson';
import { describe, expect, test } from 'vitest';
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID,
} from '../../layers/waypointLayers';
import { FINISH_INDEX, MIDDLE_INDEX, START_INDEX } from '../../types/waypointDisplayProps';
import { buildWaypointTitle, getImageIDForWaypoint, toDisplayWaypoints } from '../displayWaypoints';

const buildTestWaypoint = (properties: WaypointProps & Anything, coordinates: Position): Waypoint => ({
    type: 'Feature',
    geometry: {
        type: 'Point',
        coordinates,
    },
    properties,
});

describe('locations util tests', () => {
    test('Build waypoint title', () => {
        expect(buildWaypointTitle(null as never)).toBeUndefined();
        expect(buildWaypointTitle(buildTestWaypoint({}, [1, 2]))).toBeUndefined();
        expect(buildWaypointTitle(buildTestWaypoint({ address: {} }, [1, 2]))).toBeUndefined();
        expect(
            buildWaypointTitle({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [1, 2] },
                properties: { address: { freeformAddress: 'ADDRESS' } },
            }),
        ).toBe('ADDRESS');
        expect(buildWaypointTitle(buildTestWaypoint({ poi: { name: 'POI' } }, [1, 2]))).toEqual('POI');
        expect(
            buildWaypointTitle(
                buildTestWaypoint({ address: { freeformAddress: 'ADDRESS' }, poi: { name: 'POI' } }, [1, 2]),
            ),
        ).toBe('POI');
    });

    test('Get image ID for waypoint', () => {
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), START_INDEX)).toBe(WAYPOINT_START_IMAGE_ID);
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), MIDDLE_INDEX)).toBe(WAYPOINT_STOP_IMAGE_ID);
        expect(getImageIDForWaypoint(buildTestWaypoint({}, [1, 2]), FINISH_INDEX)).toBe(WAYPOINT_FINISH_IMAGE_ID);
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 0 }, [1, 2]), START_INDEX)).toBe(
            WAYPOINT_START_IMAGE_ID,
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 1 }, [1, 2]), START_INDEX)).toBe(
            WAYPOINT_SOFT_IMAGE_ID,
        );
        expect(getImageIDForWaypoint(buildTestWaypoint({ radiusMeters: 1 }, [1, 2]), MIDDLE_INDEX)).toBe(
            WAYPOINT_SOFT_IMAGE_ID,
        );
    });

    test('To display waypoints', () => {
        expect(toDisplayWaypoints([], undefined)).toEqual({ type: 'FeatureCollection', features: [] });
        expect(toDisplayWaypoints([null], undefined)).toEqual({ type: 'FeatureCollection', features: [] });
        expect(
            toDisplayWaypoints(
                [buildTestWaypoint({ entryPoints: [{ type: 'main', position: [44, 55] }] }, [1, 2])],
                undefined,
            ),
        ).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [1, 2] },
                    properties: {
                        id: expect.any(String),
                        index: 0,
                        indexType: START_INDEX,
                        iconID: WAYPOINT_START_IMAGE_ID,
                        entryPoints: [{ type: 'main', position: [44, 55] }],
                    },
                },
            ],
        });
        expect(
            toDisplayWaypoints([buildTestWaypoint({ entryPoints: [{ type: 'main', position: [44, 55] }] }, [1, 2])], {
                entryPoints: 'main-when-available',
            }),
        ).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [44, 55] },
                    properties: {
                        id: expect.any(String),
                        index: 0,
                        indexType: START_INDEX,
                        iconID: WAYPOINT_START_IMAGE_ID,
                        entryPoints: [{ type: 'main', position: [44, 55] }],
                    },
                },
            ],
        });
        expect(toDisplayWaypoints([null, buildTestWaypoint({}, [1, 2])], undefined)).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [1, 2] },
                    properties: {
                        id: expect.any(String),
                        index: 1,
                        indexType: FINISH_INDEX,
                        iconID: WAYPOINT_FINISH_IMAGE_ID,
                    },
                },
            ],
        });
        expect(toDisplayWaypoints([null, buildTestWaypoint({}, [1, 2]), null], undefined)).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [1, 2] },
                    properties: {
                        id: expect.any(String),
                        index: 1,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 1,
                    },
                },
            ],
        });
        expect(
            toDisplayWaypoints(
                [
                    buildTestWaypoint({ poi: { name: 'POI' } }, [1, 2]),
                    buildTestWaypoint({ radiusMeters: 25 }, [3, 4]),
                    buildTestWaypoint({ address: { freeformAddress: 'ADDRESS' } }, [5, 6]),
                    [9, 10],
                    { type: 'Point', coordinates: [11, 12] },
                    {
                        ...buildTestWaypoint({ address: { freeformAddress: 'ADDRESS2' } }, [13, 14]),
                        bbox: [1, 2, 3, 4],
                        id: 'ALREADY_DEFINED',
                    },
                ],
                undefined,
            ),
        ).toEqual({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [1, 2] },
                    properties: {
                        id: expect.any(String),
                        poi: { name: 'POI' },
                        index: 0,
                        indexType: START_INDEX,
                        iconID: WAYPOINT_START_IMAGE_ID,
                        title: 'POI',
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [3, 4] },
                    properties: {
                        id: expect.any(String),
                        radiusMeters: 25,
                        index: 1,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_SOFT_IMAGE_ID,
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [5, 6] },
                    properties: {
                        id: expect.any(String),
                        address: { freeformAddress: 'ADDRESS' },
                        index: 2,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        title: 'ADDRESS',
                        stopDisplayIndex: 1,
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [9, 10] },
                    properties: {
                        id: expect.any(String),
                        index: 3,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 2,
                    },
                },
                {
                    type: 'Feature',
                    id: expect.any(String),
                    geometry: { type: 'Point', coordinates: [11, 12] },
                    properties: {
                        id: expect.any(String),
                        index: 4,
                        indexType: MIDDLE_INDEX,
                        iconID: WAYPOINT_STOP_IMAGE_ID,
                        stopDisplayIndex: 3,
                    },
                },
                {
                    type: 'Feature',
                    id: 'ALREADY_DEFINED',
                    geometry: { type: 'Point', coordinates: [13, 14] },
                    properties: {
                        id: 'ALREADY_DEFINED',
                        address: { freeformAddress: 'ADDRESS2' },
                        index: 5,
                        indexType: FINISH_INDEX,
                        iconID: WAYPOINT_FINISH_IMAGE_ID,
                        title: 'ADDRESS2',
                    },
                    bbox: [1, 2, 3, 4],
                },
            ],
        });
    });
});
