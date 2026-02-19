import { nearestPointOnLine } from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import type {
    Route,
    RouteProgressAtPoint,
    RouteProgressPoint,
    RouteSegmentProgress,
    SectionProps,
    WaypointLike,
} from '../types';
import { bboxExpandedWithPosition } from './bbox';
import { getPositionStrict } from './lngLat';

/**
 * Finds the best index to insert a new waypoint into an existing route.
 *
 * This function determines the optimal position to insert a new waypoint among existing waypoints
 * by finding where it fits most naturally along the route line. The algorithm:
 * 1. Projects each existing waypoint onto the route line to find their closest points
 * 2. Projects the new waypoint onto the route line
 * 3. Determines where the new waypoint fits based on its position along the route
 *
 * @param route The existing calculated route Feature with LineString geometry
 * @param existingWaypoints Array of existing waypoints in order (origin, intermediate waypoints, destination)
 * @param newWaypoint The new waypoint to insert
 * @returns The index where the new waypoint should be inserted (0 means insert at the beginning,
 *          existingWaypoints.length means append at the end)
 *
 * @remarks
 * - If the route has no coordinates, returns 0
 * - If there are fewer than 2 existing waypoints, returns 0
 * - The function finds where the new waypoint naturally fits along the route's progression
 * - This creates a more streamlined route by minimizing detours
 *
 * @example
 * ```typescript
 * const route: Route = {
 *   type: 'Feature',
 *   id: 'route-1',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[4.9, 52.3], [4.95, 52.35], [5.0, 52.4]]
 *   },
 *   properties: { ... },
 *   bbox: [4.9, 52.3, 5.0, 52.4]
 * };
 *
 * const waypoints: WaypointLike[] = [
 *   [4.9, 52.3],   // origin
 *   [5.0, 52.4]    // destination
 * ];
 *
 * const newWaypoint: WaypointLike = [4.95, 52.35];
 *
 * const insertIndex = findBestWaypointInsertionIndex(route, waypoints, newWaypoint);
 * // Returns: 1 (insert between origin and destination)
 *
 * const updatedWaypoints = [
 *   ...waypoints.slice(0, insertIndex),
 *   newWaypoint,
 *   ...waypoints.slice(insertIndex)
 * ];
 * ```
 *
 * @group Utils
 */
export const findBestWaypointInsertionIndex = (
    route: Route,
    existingWaypoints: WaypointLike[],
    newWaypoint: WaypointLike,
): number => {
    const routeCoords = route.geometry.coordinates;

    // Edge cases
    if (routeCoords.length === 0) return 0;
    if (existingWaypoints.length < 2) return 0;

    const routeLine: Feature<LineString> = {
        type: 'Feature',
        geometry: route.geometry,
        properties: {},
    };

    // Project the new waypoint onto the route line
    const newWaypointPos = getPositionStrict(newWaypoint);
    const newWaypointProjection = nearestPointOnLine(routeLine, newWaypointPos);
    const newWaypointLocation = newWaypointProjection.properties.location;

    if (newWaypointLocation === undefined) return 0;

    // Project each existing waypoint onto the route line and get their locations
    const waypointLocations: number[] = [];
    for (const waypoint of existingWaypoints) {
        const waypointPos = getPositionStrict(waypoint);
        const projection = nearestPointOnLine(routeLine, waypointPos);
        waypointLocations.push(projection.properties.location ?? 0);
    }

    // Find the insertion index where the new waypoint's location fits
    // between existing waypoint locations
    for (let i = 0; i < waypointLocations.length - 1; i++) {
        const currentLocation = waypointLocations[i];
        const nextLocation = waypointLocations[i + 1];

        if (newWaypointLocation >= currentLocation && newWaypointLocation <= nextLocation) {
            return i + 1;
        }
    }

    // If the new waypoint is before all existing waypoints, insert at the beginning
    if (newWaypointLocation < waypointLocations[0]) {
        return 0;
    }

    // If the new waypoint is beyond all existing waypoints, append at the end
    return existingWaypoints.length;
};

/**
 * Returns a new array of waypoints with the new waypoint inserted at the optimal position.
 *
 * This is a convenience function that combines finding the best insertion index and
 * inserting the waypoint in one step. It uses {@link findBestWaypointInsertionIndex}
 * to determine where the waypoint fits most naturally along the route.
 *
 * @param route The existing calculated route Feature with LineString geometry
 * @param existingWaypoints Array of existing waypoints in order (origin, intermediate waypoints, destination)
 * @param newWaypoint The new waypoint to insert
 * @returns A new array with the waypoint inserted at the optimal position
 *
 * @remarks
 * - Returns a new array; does not modify the original waypoints array
 * - Uses the same logic as findBestWaypointInsertionIndex to determine position
 * - Handles all edge cases (empty route, fewer than 2 waypoints)
 *
 * @example
 * ```typescript
 * const route: Route = {
 *   type: 'Feature',
 *   id: 'route-1',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[4.9, 52.3], [4.95, 52.35], [5.0, 52.4]]
 *   },
 *   properties: { ... },
 *   bbox: [4.9, 52.3, 5.0, 52.4]
 * };
 *
 * const waypoints: WaypointLike[] = [
 *   [4.9, 52.3],   // origin
 *   [5.0, 52.4]    // destination
 * ];
 *
 * const newWaypoint: WaypointLike = [4.95, 52.35];
 *
 * const updatedWaypoints = withInsertedWaypoint(route, waypoints, newWaypoint);
 * // Returns: [[4.9, 52.3], [4.95, 52.35], [5.0, 52.4]]
 * ```
 *
 * @group Utils
 */
export const withInsertedWaypoint = (
    route: Route,
    existingWaypoints: WaypointLike[],
    newWaypoint: WaypointLike,
): WaypointLike[] => {
    const insertIndex = findBestWaypointInsertionIndex(route, existingWaypoints, newWaypoint);
    return [...existingWaypoints.slice(0, insertIndex), newWaypoint, ...existingWaypoints.slice(insertIndex)];
};

/**
 * Interpolates the cumulative traveled distance and time at an arbitrary point on the route path.
 *
 * Uses the route's `progress` array to linearly interpolate between the two bracketing
 * {@link RouteProgressPoint} entries that surround the requested `pathIndex`.
 *
 * @param route The route whose `properties.progress` will be used for interpolation.
 *              The progress array must cover the requested index (i.e. the first entry's
 *              `pointIndex` must be ≤ `pathIndex` and the last's must be ≥ `pathIndex`).
 * @param pathIndex Zero-based index into the route's coordinate array.
 * @returns Interpolated {@link RouteProgressAtPoint}, or `undefined` when:
 *   - the route has no `progress` data
 *   - `pathIndex` is outside `[0, coordinates.length - 1]`
 *   - `pathIndex` falls outside the range covered by the progress entries
 *   - any required distance or time value is missing from the bracketing entries
 *
 * @example
 * ```typescript
 * const progress = route.properties.progress;
 * // progress = [
 * //   { pointIndex: 0,  distanceInMeters: 0,    travelTimeInSeconds: 0   },
 * //   { pointIndex: 50, distanceInMeters: 2500,  travelTimeInSeconds: 120 },
 * //   { pointIndex: 100,distanceInMeters: 5000,  travelTimeInSeconds: 300 }
 * // ]
 *
 * const result = interpolateProgressAtIndex(route, 25);
 * // result = { distanceInMeters: 1250, travelTimeInSeconds: 60 }
 * ```
 *
 * @group Utils
 */
export const interpolateProgressAtIndex = (route: Route, pathIndex: number): RouteProgressAtPoint | undefined => {
    const { progress } = route.properties;
    if (!progress || progress.length === 0) return undefined;

    const coordCount = route.geometry.coordinates.length;
    if (pathIndex < 0 || pathIndex >= coordCount) return undefined;

    // Find the closest bracketing entries in the (sorted) progress array.
    let lowerPoint: RouteProgressPoint | undefined;
    let upperPoint: RouteProgressPoint | undefined;

    for (const point of progress) {
        if (point.pointIndex <= pathIndex) {
            lowerPoint = point;
        }
        if (point.pointIndex >= pathIndex && upperPoint === undefined) {
            upperPoint = point;
        }
    }

    if (!lowerPoint || !upperPoint) return undefined;

    const lowerDist = lowerPoint.distanceInMeters;
    const upperDist = upperPoint.distanceInMeters;
    const lowerTime = lowerPoint.travelTimeInSeconds;
    const upperTime = upperPoint.travelTimeInSeconds;

    if (lowerDist === undefined || upperDist === undefined || lowerTime === undefined || upperTime === undefined) {
        return undefined;
    }

    // Exact match — no interpolation needed.
    if (lowerPoint.pointIndex === upperPoint.pointIndex) {
        return { distanceInMeters: lowerDist, travelTimeInSeconds: lowerTime };
    }

    const ratio = (pathIndex - lowerPoint.pointIndex) / (upperPoint.pointIndex - lowerPoint.pointIndex);
    return {
        distanceInMeters: lowerDist + ratio * (upperDist - lowerDist),
        travelTimeInSeconds: lowerTime + ratio * (upperTime - lowerTime),
    };
};

/**
 * Calculates progress measurements for a segment between two arbitrary points on the route path.
 *
 * Calls {@link interpolateProgressAtIndex} for both indices and exposes the start and end
 * measurements together with the delta (distance and time covered between them).
 *
 * @param route The route whose `properties.progress` will be used for interpolation.
 * @param startPathIndex Zero-based index of the segment start in the route's coordinate array.
 * @param endPathIndex Zero-based index of the segment end in the route's coordinate array.
 * @returns A {@link RouteSegmentProgress} object, or `undefined` when either index cannot
 *          be interpolated (see {@link interpolateProgressAtIndex} for the full list of conditions).
 *
 * @example
 * ```typescript
 * const result = getRouteProgressBetween(route, 10, 60);
 * if (result) {
 *   console.log(`Segment starts ${result.start.distanceInMeters} m from route origin`);
 *   console.log(`Segment ends   ${result.end.distanceInMeters} m from route origin`);
 *   console.log(`Segment length ${result.delta.distanceInMeters} m`);
 *   console.log(`Segment takes  ${result.delta.travelTimeInSeconds} s`);
 * }
 * ```
 *
 * @group Utils
 */
export const getRouteProgressBetween = (
    route: Route,
    startPathIndex: number,
    endPathIndex: number,
): RouteSegmentProgress | undefined => {
    const start = interpolateProgressAtIndex(route, startPathIndex);
    const end = interpolateProgressAtIndex(route, endPathIndex);

    if (!start || !end) return undefined;

    return {
        start,
        end,
        delta: {
            distanceInMeters: end.distanceInMeters - start.distanceInMeters,
            travelTimeInSeconds: end.travelTimeInSeconds - start.travelTimeInSeconds,
        },
    };
};

/**
 * Calculates progress measurements for a route section.
 *
 * Convenience wrapper around {@link getRouteProgressBetween} that accepts a {@link SectionProps}
 * directly, using its `startPointIndex` and `endPointIndex` as the segment bounds.
 *
 * @param route The route whose `properties.progress` will be used for interpolation.
 * @param section The section whose start and end point indices define the segment.
 * @returns A {@link RouteSegmentProgress} object, or `undefined` when either index cannot
 *          be interpolated (see {@link interpolateProgressAtIndex} for the full list of conditions).
 *
 * @example
 * ```typescript
 * const section = route.properties.sections.countries[0];
 * const result = getRouteProgressForSection(route, section);
 * if (result) {
 *   console.log(`Section starts ${result.start.distanceInMeters} m from route origin`);
 *   console.log(`Section ends   ${result.end.distanceInMeters} m from route origin`);
 *   console.log(`Section length ${result.delta.distanceInMeters} m`);
 *   console.log(`Section takes  ${result.delta.travelTimeInSeconds} s`);
 * }
 * ```
 *
 * @group Utils
 */
export const getRouteProgressForSection = (route: Route, section: SectionProps): RouteSegmentProgress | undefined => {
    return getRouteProgressBetween(route, section.startPointIndex, section.endPointIndex);
};

/**
 * Calculates the bounding box for a route section.
 *
 * This function computes a bbox by sampling coordinates from the section at three key points:
 * - Start point (startPointIndex)
 * - Middle point (midpoint between start and end)
 * - End point (endPointIndex)
 *
 * @param route The route containing the section
 * @param section The section to calculate the bbox for
 * @returns The bounding box as [minLng, minLat, maxLng, maxLat], or `undefined` if the section or route is invalid
 *
 * @remarks
 * - Samples three points for efficiency while maintaining good accuracy
 * - Returns `undefined` if the route has no coordinates or section indices are invalid
 * - Uses existing bbox utilities for consistent calculation
 *
 * @example
 * ```typescript
 * const section = route.properties.sections.countries[0];
 * // section = { id: 'section-1', startPointIndex: 0, endPointIndex: 3, countryCodeISO3: 'NLD' }
 *
 * const bbox = getSectionBBox(route, section);
 * // Returns: [minLng, minLat, maxLng, maxLat] spanning the section, or undefined
 * ```
 *
 * @group Utils
 */
export const getSectionBBox = (route: Route, section: SectionProps) => {
    const routeCoords = route.geometry.coordinates;

    // Validate inputs
    if (
        !routeCoords ||
        routeCoords.length === 0 ||
        section.startPointIndex < 0 ||
        section.endPointIndex >= routeCoords.length ||
        section.startPointIndex > section.endPointIndex
    ) {
        return undefined;
    }

    // Sample three points: start, middle, end
    const startPoint = routeCoords[section.startPointIndex];
    const endPoint = routeCoords[section.endPointIndex];
    const middleIndex = Math.floor((section.startPointIndex + section.endPointIndex) / 2);
    const middlePoint = routeCoords[middleIndex];

    // Build bbox by expanding with each sampled point
    let bbox = bboxExpandedWithPosition(startPoint);
    bbox = bboxExpandedWithPosition(middlePoint, bbox);
    bbox = bboxExpandedWithPosition(endPoint, bbox);

    return bbox;
};
