import { nearestPointOnLine } from '@turf/turf';
import type { Position } from 'geojson';
import type {
    HasLngLat,
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

    // Project the new waypoint onto the route line
    const newWaypointPos = getPositionStrict(newWaypoint);
    const newWaypointProjection = nearestPointOnLine(route, newWaypointPos);
    const newWaypointLocation = newWaypointProjection.properties.location;

    if (newWaypointLocation === undefined) return 0;

    // Project each existing waypoint onto the route line and get their locations
    const waypointLocations: number[] = [];
    for (const waypoint of existingWaypoints) {
        const waypointPos = getPositionStrict(waypoint);
        const projection = nearestPointOnLine(route, waypointPos);
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
 * const result = calculateProgressAtRoutePoint(route, 25);
 * // result = { distanceInMeters: 1250, travelTimeInSeconds: 60 }
 * ```
 *
 * @group Utils
 */
export const calculateProgressAtRoutePoint = (route: Route, pathIndex: number): RouteProgressAtPoint | undefined => {
    const { progress } = route.properties;
    if (!progress || progress.length === 0) return undefined;

    const coordCount = route.geometry.coordinates.length;
    if (pathIndex < 0 || pathIndex >= coordCount) return undefined;

    const bracket = findBracketingProgressPoints(progress, 'pointIndex', pathIndex);
    if (!bracket) return undefined;

    const { lower, lowerVal: lowerIndex, upper, upperVal: upperIndex } = bracket;

    const lowerDist = lower.distanceInMeters;
    const upperDist = upper.distanceInMeters;
    const lowerTime = lower.travelTimeInSeconds;
    const upperTime = upper.travelTimeInSeconds;

    if (lowerDist === undefined || upperDist === undefined || lowerTime === undefined || upperTime === undefined) {
        return undefined;
    }

    // Exact match — no interpolation needed.
    if (lowerIndex === upperIndex) {
        return { distanceInMeters: lowerDist, travelTimeInSeconds: lowerTime };
    }

    const ratio = (pathIndex - lowerIndex) / (upperIndex - lowerIndex);
    return {
        distanceInMeters: lowerDist + ratio * (upperDist - lowerDist),
        travelTimeInSeconds: lowerTime + ratio * (upperTime - lowerTime),
    };
};

/**
 * Calculates progress measurements for a segment between two arbitrary points on the route path.
 *
 * Calls {@link calculateProgressAtRoutePoint} for both indices and exposes the start and end
 * measurements together with the delta (distance and time covered between them).
 *
 * @param route The route whose `properties.progress` will be used for interpolation.
 * @param startPathIndex Zero-based index of the segment start in the route's coordinate array.
 * @param endPathIndex Zero-based index of the segment end in the route's coordinate array.
 * @returns A {@link RouteSegmentProgress} object, or `undefined` when either index cannot
 *          be interpolated (see {@link calculateProgressAtRoutePoint} for the full list of conditions).
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
    const start = calculateProgressAtRoutePoint(route, startPathIndex);
    const end = calculateProgressAtRoutePoint(route, endPathIndex);

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
 *          be interpolated (see {@link calculateProgressAtRoutePoint} for the full list of conditions).
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

/**
 * Scans `progress` to find the two entries whose value for `key` bracket `value`,
 * and returns them together with their resolved numeric values.
 *
 * Uses a single forward pass: `lower` is updated to every entry whose key-value is
 * ≤ `value`; `upper` is set to the first entry whose key-value is ≥ `value`.
 * For a sorted progress array this yields the tightest bracketing pair.
 */
const findBracketingProgressPoints = (
    progress: RouteProgressPoint[],
    key: 'pointIndex' | 'travelTimeInSeconds' | 'distanceInMeters',
    value: number,
): { lower: RouteProgressPoint; lowerVal: number; upper: RouteProgressPoint; upperVal: number } | undefined => {
    let lower: RouteProgressPoint | undefined;
    let lowerVal: number | undefined;
    let upper: RouteProgressPoint | undefined;
    let upperVal: number | undefined;

    for (const point of progress) {
        const v = point[key];
        if (v === undefined) continue;
        if (v <= value) {
            lower = point;
            lowerVal = v;
        }
        if (v >= value && upper === undefined) {
            upper = point;
            upperVal = v;
        }
    }

    return lower !== undefined && lowerVal !== undefined && upper !== undefined && upperVal !== undefined
        ? { lower, lowerVal, upper, upperVal }
        : undefined;
};

/**
 * Locates the two {@link RouteProgressPoint} entries that bracket `targetValue` and returns
 * the integer path index of the lower bounding vertex together with the fractional progress
 * ratio toward the next vertex. Returns `undefined` when no bracketing pair is found.
 */
const findBracketedPathIndex = (
    progress: RouteProgressPoint[],
    targetKey: 'travelTimeInSeconds' | 'distanceInMeters',
    targetValue: number,
): { pathIndex: number; progressRatioTowardsNextPathPoint: number } | undefined => {
    const bracket = findBracketingProgressPoints(progress, targetKey, targetValue);
    if (!bracket) return undefined;

    const { lower, lowerVal, upper, upperVal } = bracket;
    const t = lowerVal === upperVal ? 0 : (targetValue - lowerVal) / (upperVal - lowerVal);
    const fractionalIndex = lower.pointIndex + t * (upper.pointIndex - lower.pointIndex);
    const pathIndex = Math.floor(fractionalIndex);
    return { pathIndex, progressRatioTowardsNextPathPoint: fractionalIndex - pathIndex };
};

/**
 * Geographic coordinate and cumulative progress values at a specific point along a route.
 *
 * @group Utils
 */
export type RouteCoordinateAtProgress = {
    /** Geographic position as a GeoJSON `[longitude, latitude]` coordinate. */
    position: Position;
    /** Cumulative travel time in seconds from the route start. */
    travelTimeInSeconds: number;
    /** Cumulative distance in meters from the route start. */
    distanceInMeters: number;
};

/**
 * Returns the fractional progress of `middlePoint` projected onto the line segment `[segmentStart, segmentEnd]`.
 *
 * Uses a dot-product projection and clamps the result to `[0, 1]`, so points before
 * `segmentStart` return `0` and points past `segmentEnd` return `1`.
 * Returns `0` for a zero-length segment.
 */
const progressRatioAlongSegment = (segmentStart: Position, middlePoint: Position, segmentEnd: Position): number => {
    const dx = segmentEnd[0] - segmentStart[0];
    const dy = segmentEnd[1] - segmentStart[1];
    const segLenSq = dx * dx + dy * dy;
    if (segLenSq === 0) return 0;
    const ratio = ((middlePoint[0] - segmentStart[0]) * dx + (middlePoint[1] - segmentStart[1]) * dy) / segLenSq;
    return Math.max(0, Math.min(1, ratio));
};

/**
 * Interpolates position and progress between two consecutive route vertices.
 *
 * @param route The route whose coordinate geometry and progress data are used.
 * @param pathIndex Integer index of the lower bounding vertex in the coordinate array.
 * @param progressRatioTowardsNextPathPoint Fractional progress in [0, 1] from `pathIndex` toward the next vertex.
 *              0 returns the lower vertex exactly; 1 returns the upper vertex exactly.
 * Returns `undefined` when progress data is unavailable for either bracketing vertex.
 */
const interpolateProgressAtPathIndex = (
    route: Route,
    pathIndex: number,
    progressRatioTowardsNextPathPoint: number,
): RouteCoordinateAtProgress | undefined => {
    const coords = route.geometry.coordinates;

    const upperCoordIndex = Math.min(pathIndex + 1, coords.length - 1);

    const lowerCoord = coords[pathIndex];
    const upperCoord = coords[upperCoordIndex];

    const lowerProgress = calculateProgressAtRoutePoint(route, pathIndex);
    const upperProgress = calculateProgressAtRoutePoint(route, upperCoordIndex);
    if (!lowerProgress || !upperProgress) return undefined;

    return {
        position: [
            lowerCoord[0] + progressRatioTowardsNextPathPoint * (upperCoord[0] - lowerCoord[0]),
            lowerCoord[1] + progressRatioTowardsNextPathPoint * (upperCoord[1] - lowerCoord[1]),
        ],
        travelTimeInSeconds:
            lowerProgress.travelTimeInSeconds +
            progressRatioTowardsNextPathPoint * (upperProgress.travelTimeInSeconds - lowerProgress.travelTimeInSeconds),
        distanceInMeters:
            lowerProgress.distanceInMeters +
            progressRatioTowardsNextPathPoint * (upperProgress.distanceInMeters - lowerProgress.distanceInMeters),
    };
};

/**
 * Resolves a `targetValue` (cumulative seconds or meters) to a {@link RouteCoordinateAtProgress}
 * by interpolating the route's progress array and coordinate geometry.
 */
const resolveCoordinateAtProgress = (
    route: Route,
    targetKey: 'travelTimeInSeconds' | 'distanceInMeters',
    targetValue: number,
): RouteCoordinateAtProgress | undefined => {
    const { progress } = route.properties;
    if (!progress || progress.length === 0) return undefined;

    const coords = route.geometry.coordinates;
    const firstPoint = progress[0];
    const lastPoint = progress.at(-1) as RouteProgressPoint;

    const firstValue = firstPoint[targetKey];
    const lastValue = lastPoint[targetKey];
    if (firstValue === undefined || lastValue === undefined) return undefined;

    // Clamp to route endpoints
    if (targetValue <= firstValue) {
        return {
            position: coords[firstPoint.pointIndex],
            travelTimeInSeconds: firstPoint.travelTimeInSeconds ?? 0,
            distanceInMeters: firstPoint.distanceInMeters ?? 0,
        };
    }
    if (targetValue >= lastValue) {
        return {
            position: coords[lastPoint.pointIndex],
            travelTimeInSeconds: lastPoint.travelTimeInSeconds ?? 0,
            distanceInMeters: lastPoint.distanceInMeters ?? 0,
        };
    }

    const result = findBracketedPathIndex(progress, targetKey, targetValue);
    if (result === undefined) return undefined;

    return interpolateProgressAtPathIndex(route, result.pathIndex, result.progressRatioTowardsNextPathPoint);
};

/**
 * Discriminated union describing how to identify a position along a route.
 * Provide exactly one of the three variants.
 *
 * @group Utils
 */
export type RouteProgressQuery =
    | { traveledTimeInSeconds: number }
    | { traveledDistanceInMeters: number }
    | { clockTime: Date };

/**
 * Returns the geographic coordinate and cumulative progress values at the point along a route
 * identified by a {@link RouteProgressQuery}.
 *
 * @param route The route to query. Must contain `properties.progress` data.
 * @param query A discriminated union — provide exactly one of:
 *   - `{ traveledTimeInSeconds }` — elapsed seconds from route start
 *   - `{ traveledDistanceInMeters }` — meters traveled from route start
 *   - `{ clockTime }` — absolute `Date`; elapsed seconds are derived from `route.summary.departureTime`
 * @returns Interpolated {@link RouteCoordinateAtProgress}, or `undefined` when:
 *   - the route has no `progress` data
 *   - `clockTime` is before the route departure time
 *   - the progress data is incomplete for the requested position
 *
 * @example
 * ```typescript
 * // By elapsed time
 * const pos = getCoordinateAtRouteProgress(route, { traveledTimeInSeconds: 600 });
 *
 * // By distance
 * const pos = getCoordinateAtRouteProgress(route, { traveledDistanceInMeters: 5000 });
 *
 * // By clock time
 * const pos = getCoordinateAtRouteProgress(route, { clockTime: new Date('2025-06-01T09:30:00Z') });
 * ```
 *
 * @group Utils
 */
export const getCoordinateAtRouteProgress = (
    route: Route,
    query: RouteProgressQuery,
): RouteCoordinateAtProgress | undefined => {
    if ('traveledTimeInSeconds' in query) {
        return resolveCoordinateAtProgress(route, 'travelTimeInSeconds', query.traveledTimeInSeconds);
    }

    if ('traveledDistanceInMeters' in query) {
        return resolveCoordinateAtProgress(route, 'distanceInMeters', query.traveledDistanceInMeters);
    }

    const departureTime = route.properties.summary.departureTime;
    if (!departureTime) return undefined;

    const elapsedSeconds = (query.clockTime.getTime() - departureTime.getTime()) / 1000;
    if (elapsedSeconds < 0) return undefined;

    return resolveCoordinateAtProgress(route, 'travelTimeInSeconds', elapsedSeconds);
};

/**
 * Returns the geographic coordinate and cumulative progress values at the point on a route
 * nearest to the given location.
 *
 * Projects `point` onto the route line using `nearestPointOnLine`, then linearly interpolates
 * the progress data at the snapped position between the two bracketing route vertices.
 *
 * @param route The route to query. Must contain `properties.progress` data.
 * @param point The reference location to snap to the route.
 * @returns Interpolated {@link RouteCoordinateAtProgress} at the nearest point, or `undefined` when:
 *   - the route has no progress data
 *   - the route has fewer than 2 coordinates
 *   - the progress data is incomplete for the snapped position
 *
 * @example
 * ```typescript
 * const result = getProgressAtNearestRoutePoint(route, { lng: 4.92, lat: 52.32 });
 * if (result) {
 *   console.log(`Nearest point: [${result.position}]`);
 *   console.log(`${result.distanceInMeters} m from route start`);
 *   console.log(`${result.travelTimeInSeconds} s travel time from route start`);
 * }
 * ```
 *
 * @group Utils
 */
export const getProgressAtNearestRoutePoint = (
    route: Route,
    point: HasLngLat,
): RouteCoordinateAtProgress | undefined => {
    const { progress } = route.properties;
    if (!progress?.length) return undefined;

    const coords = route.geometry.coordinates;

    const snapped = nearestPointOnLine(route, getPositionStrict(point));

    // `nearestPointOnLine` sets `index` to the start-vertex index of the nearest segment,
    // so the snapped point lies on the segment [index, index + 1].
    const segmentStartIndex = snapped.properties.index ?? 0;
    const segmentEndIndex = Math.min(segmentStartIndex + 1, coords.length - 1);

    const segmentStart = coords[segmentStartIndex];
    const segmentEnd = coords[segmentEndIndex];
    const progressRatioFromSegmentStart = progressRatioAlongSegment(
        segmentStart,
        snapped.geometry.coordinates,
        segmentEnd,
    );

    return interpolateProgressAtPathIndex(route, segmentStartIndex, progressRatioFromSegmentStart);
};
