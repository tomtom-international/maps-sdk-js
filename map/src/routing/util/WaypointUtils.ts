import { CommonPlaceProps, Waypoint, WaypointLike, Waypoints } from "@anw/go-sdk-js/core";
import { Point, Position } from "geojson";
import {
    FINISH_INDEX,
    IndexType,
    MIDDLE_INDEX,
    START_INDEX,
    WaypointDisplayProps
} from "../types/WaypointDisplayProps";
import {
    WAYPOINT_FINISH_IMAGE_ID,
    WAYPOINT_SOFT_IMAGE_ID,
    WAYPOINT_START_IMAGE_ID,
    WAYPOINT_STOP_IMAGE_ID
} from "../layers/waypointLayers";
import { PlanningWaypoint } from "../types/PlanningWaypoint";

const indexTypeFor = (index: number, arrayLength: number): IndexType =>
    index === 0 ? START_INDEX : index < arrayLength - 1 ? MIDDLE_INDEX : FINISH_INDEX;

/**
 * Builds the title of the given waypoint.
 * @param waypoint The waypoint for which to build the title.
 */
export const buildWaypointTitle = (waypoint: Waypoint): string | undefined => {
    const placeProperties = waypoint?.properties as CommonPlaceProps;
    return placeProperties?.poi?.name || placeProperties?.address?.freeformAddress || undefined;
};

export const getImageIDForWaypoint = (waypoint: Waypoint, indexType: IndexType): string => {
    if (waypoint.properties.radiusMeters) {
        return WAYPOINT_SOFT_IMAGE_ID;
    } else {
        switch (indexType) {
            case "start":
                return WAYPOINT_START_IMAGE_ID;
            case "finish":
                return WAYPOINT_FINISH_IMAGE_ID;
            default:
                return WAYPOINT_STOP_IMAGE_ID;
        }
    }
};

const toWaypointFromPosition = (position: Position): Waypoint => ({
    type: "Feature",
    geometry: {
        type: "Point",
        coordinates: position
    },
    properties: {}
});

const toWaypointFromPoint = (point: Point): Waypoint => ({
    type: "Feature",
    geometry: point,
    properties: {},
    ...(point.bbox && { bbox: point.bbox })
});

const asWaypoint = (waypointInput: WaypointLike): Waypoint => {
    if (Array.isArray(waypointInput)) {
        return toWaypointFromPosition(waypointInput);
    } else if (waypointInput.type === "Point") {
        return toWaypointFromPoint(waypointInput);
    } else {
        return waypointInput as Waypoint;
    }
};

/**
 * Determines whether the given waypoint is a regular start/stop/destination with guidance attached,
 * as opposed to a circle (soft) waypoint.
 * @param waypoint The waypoint to verify.
 */
export const isHardWaypoint = (waypoint: Waypoint): boolean => !waypoint.properties.radiusMeters;

/**
 * Generates display-ready waypoints for the given planning context ones.
 * @param waypoints The planning context waypoints.
 */
export const toDisplayWaypoints = (waypoints: PlanningWaypoint[]): Waypoints<WaypointDisplayProps> => {
    // Since waypoints are of mixed types (hard and soft), we need to calculate the hard-only indexes
    // in case we have stops with numbered icons:
    let hardWaypointIndex = -1;
    return {
        type: "FeatureCollection",
        features: waypoints
            .map((waypointInput, index) => {
                if (!waypointInput) {
                    // (we consider placeholder waypoints to be "hard", since they typically occupy a position in a planner panel)
                    hardWaypointIndex++;
                    // (will be filtered out below - we don't pre-filter it to keep the original input index)
                    return null as unknown as Waypoint<WaypointDisplayProps>;
                }
                const waypoint: Waypoint = asWaypoint(waypointInput);
                const indexType = indexTypeFor(index, waypoints.length);
                const hardWaypoint = isHardWaypoint(waypoint);
                if (hardWaypoint) {
                    hardWaypointIndex++;
                }
                const title = buildWaypointTitle(waypoint);
                return {
                    ...waypoint,
                    properties: {
                        ...waypoint.properties,
                        index,
                        indexType,
                        ...(title && { title }),
                        iconID: getImageIDForWaypoint(waypoint, indexType),
                        ...(hardWaypoint && indexType === MIDDLE_INDEX && { stopDisplayIndex: hardWaypointIndex })
                    }
                };
            })
            .filter((feature) => feature)
    };
};
