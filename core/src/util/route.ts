import { nearestPointOnLine } from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import type { Route, SectionProps, WaypointLike } from '../types';
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
 * @group Route
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
 * @group Route
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
 * Calculates the bounding box for a route section.
 *
 * This function computes a bbox by sampling coordinates from the section at three key points:
 * - Start point (startPointIndex)
 * - Middle point (midpoint between start and end)
 * - End point (endPointIndex)
 *
 * @param route The route containing the section
 * @param section The section to calculate the bbox for
 * @returns The bounding box as [minLng, minLat, maxLng, maxLat], or undefined if the section or route is invalid
 *
 * @remarks
 * - Samples three points for efficiency while maintaining good accuracy
 * - Returns undefined if the route has no coordinates or section indices are invalid
 * - Uses existing bbox utilities for consistent calculation
 *
 * @example
 * ```typescript
 * const route: Route = {
 *   type: 'Feature',
 *   id: 'route-1',
 *   geometry: {
 *     type: 'LineString',
 *     coordinates: [[4.9, 52.3], [4.95, 52.35], [5.0, 52.4], [5.1, 52.5]]
 *   },
 *   properties: {
 *     summary: { ... },
 *     sections: {
 *       countries: [{
 *         id: 'section-1',
 *         startPointIndex: 0,
 *         endPointIndex: 3,
 *         countryCodeISO3: 'NLD'
 *       }]
 *     },
 *     index: 0
 *   },
 *   bbox: [4.9, 52.3, 5.1, 52.5]
 * };
 *
 * const section = route.properties.sections.countries[0];
 * const sectionBbox = getSectionBBox(route, section);
 * // Returns: [4.9, 52.3, 5.1, 52.5] (bbox containing start, middle, and end points)
 * ```
 *
 * @group Route
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
