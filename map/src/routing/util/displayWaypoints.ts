import type { CommonPlaceProps, TimeDisplayUnits, Waypoint, WaypointLike, Waypoints } from '@tomtom-org/maps-sdk/core';
import { formatDuration, generateId, getPosition } from '@tomtom-org/maps-sdk/core';
import type { Point, Position } from 'geojson';
import { suffixNumber } from '../../shared/layers/utils';
import { WAYPOINT_FINISH_IMAGE_ID, WAYPOINT_START_IMAGE_ID, WAYPOINT_STOP_IMAGE_ID } from '../layers/waypointLayers';
import type { PlanningWaypoint } from '../types/planningWaypoint';
import type { WaypointsConfig } from '../types/routeModuleConfig';
import type { WaypointDisplayProps, WaypointIndexType } from '../types/waypointDisplayProps';
import { FINISH_INDEX, MIDDLE_INDEX, START_INDEX } from '../types/waypointDisplayProps';

const indexTypeFor = (index: number, arrayLength: number): WaypointIndexType =>
    index === 0 ? START_INDEX : index < arrayLength - 1 ? MIDDLE_INDEX : FINISH_INDEX;

/**
 * Builds the title of the given waypoint.
 * @param waypoint The waypoint for which to build the title.
 */
export const buildWaypointTitle = (waypoint: Waypoint): string | undefined => {
    const placeProperties = waypoint?.properties as CommonPlaceProps;
    return placeProperties?.poi?.name ?? placeProperties?.address?.freeformAddress ?? undefined;
};

export const getImageIDForWaypoint = (
    waypoint: Waypoint,
    indexType: WaypointIndexType,
    instanceIndex?: number,
): string => {
    let baseImageID: string;
    switch (indexType) {
        case 'start':
            baseImageID = WAYPOINT_START_IMAGE_ID;
            break;
        case 'finish':
            baseImageID = WAYPOINT_FINISH_IMAGE_ID;
            break;
        default:
            baseImageID = WAYPOINT_STOP_IMAGE_ID;
            break;
    }
    return instanceIndex !== undefined ? suffixNumber(baseImageID, instanceIndex) : baseImageID;
};

const toWaypointFromPosition = (position: Position): Waypoint => ({
    type: 'Feature',
    geometry: {
        type: 'Point',
        coordinates: position,
    },
    properties: {},
});

const toWaypointFromPoint = (point: Point): Waypoint => ({
    type: 'Feature',
    geometry: point,
    properties: {},
    ...(point.bbox && { bbox: point.bbox }),
});

const asWaypoint = (waypointInput: WaypointLike): Waypoint => {
    if (Array.isArray(waypointInput)) {
        return toWaypointFromPosition(waypointInput);
    }
    if (waypointInput.type === 'Point') {
        return toWaypointFromPoint(waypointInput);
    }
    return waypointInput as Waypoint;
};

/**
 * Generates display-ready waypoints for the given planning context ones.
 * @param waypoints The planning context waypoints.
 * @param options
 * @param instanceIndex Optional instance index for supporting multiple RoutingModule instances
 */
export const toDisplayWaypoints = (
    waypoints: PlanningWaypoint[],
    options: WaypointsConfig | undefined,
    instanceIndex?: number,
    timeUnits?: TimeDisplayUnits,
): Waypoints<WaypointDisplayProps> => {
    return {
        type: 'FeatureCollection',
        features: waypoints
            .map((waypointInput, index) => {
                if (!waypointInput) {
                    // (will be filtered out below - we don't pre-filter it to keep the original input index,
                    // since a placeholder still occupies a position in a planner panel)
                    return null as unknown as Waypoint<WaypointDisplayProps>;
                }
                const waypoint: Waypoint = asWaypoint(waypointInput);
                const indexType = indexTypeFor(index, waypoints.length);
                const title = buildWaypointTitle(waypoint);
                const id = (waypoint.id as string) ?? generateId();
                const stopDuration = formatDuration(waypoint.properties.pauseDurationSeconds, timeUnits);
                return {
                    ...waypoint,
                    ...(options?.entryPoints === 'main-when-available' && {
                        geometry: {
                            type: 'Point',
                            // We replace the waypoint coordinates with their main entry point ones:
                            coordinates: getPosition(waypoint, { useEntryPoint: 'main-when-available' }),
                        } as Point,
                    }),
                    id,
                    properties: {
                        ...waypoint.properties,
                        id,
                        index,
                        indexType,
                        ...(title && { title }),
                        ...(stopDuration && { stopDuration }),
                        iconID: getImageIDForWaypoint(waypoint, indexType, instanceIndex),
                        // The origin holds index 0, so a middle waypoint's own index is its stop number:
                        ...(indexType === MIDDLE_INDEX && { stopDisplayIndex: index }),
                    },
                };
            })
            .filter((feature) => feature),
    };
};
