import type { Feature, FeatureCollection, Point, Position } from 'geojson';
import type { Anything } from '../generic';
import type { HasLngLat } from '../geojson';
import type { Route } from './route';

/**
 * Properties specific to route waypoints.
 *
 * @group Route
 */
export type WaypointProps = {
    /**
     * How long the vehicle waits at this stop, in seconds.
     *
     * When specified, the routing service adds the wait to the leg arriving at this waypoint, and
     * the map shows it on the stop's pin.
     *
     * @remarks
     * - The wait counts towards the route's `travelTimeInSeconds`, not only its arrival time
     * - Not supported on the destination: the routing service requires the last leg's wait to be 0
     *
     * @example
     * ```typescript
     * // Wait 30 minutes at this stop
     * { pauseDurationSeconds: 30 * 60 }
     * ```
     */
    pauseDurationSeconds?: number;
};

/**
 * GeoJSON Feature representing a route waypoint.
 *
 * Waypoints are points that define the route path. The route will pass through each waypoint
 * in the order they are specified.
 *
 * @typeParam T - Additional custom properties beyond the standard waypoint properties
 *
 * @remarks
 * Every waypoint creates a route leg and an arrival instruction.
 *
 * @example
 * ```typescript
 * // Regular waypoint
 * const waypoint: Waypoint = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
 *   properties: {}
 * };
 *
 * // Waypoint with custom properties
 * const namedWaypoint: Waypoint<{ name: string }> = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
 *   properties: { name: 'Amsterdam' }
 * };
 * ```
 *
 * @group Route
 */
export type Waypoint<T extends Anything = Anything> = Feature<Point, WaypointProps & T>;

/**
 * GeoJSON FeatureCollection of waypoints.
 *
 * Contains multiple waypoints that together define a multi-stop route.
 *
 * @typeParam T - Additional custom properties for individual waypoints
 *
 * @example
 * ```typescript
 * const waypoints: Waypoints = {
 *   type: 'FeatureCollection',
 *   features: [
 *     { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.3] }, properties: {} },
 *     { type: 'Feature', geometry: { type: 'Point', coordinates: [4.95, 52.35] }, properties: {} }
 *   ]
 * };
 * ```
 *
 * @group Route
 */
export type Waypoints<T extends Anything = Anything> = FeatureCollection<Point, WaypointProps & T>;

/**
 * Flexible input type for specifying a waypoint location.
 *
 * Accepts various formats for convenience:
 * - Full `Waypoint` Feature (for waypoints carrying custom properties)
 * - Any object with coordinates (Position array, Point geometry, or Feature)
 *
 * @remarks
 * Waypoints are single points by default. Use the full Waypoint Feature format to carry
 * properties of your own alongside the position.
 *
 * @example
 * ```typescript
 * // As coordinate array
 * const wp1: WaypointLike = [4.9041, 52.3676];
 *
 * // As Point geometry
 * const wp2: WaypointLike = { type: 'Point', coordinates: [4.9041, 52.3676] };
 *
 * // As full Waypoint Feature carrying custom properties
 * const wp3: WaypointLike = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
 *   properties: { name: 'Amsterdam' }
 * };
 * ```
 *
 * @group Route
 */
export type WaypointLike = Waypoint | HasLngLat;

/**
 * Input representing a path or route to follow.
 *
 * Used for route reconstruction or when you want the calculated route to follow
 * a specific path rather than calculating a new one.
 *
 * @remarks
 * - `Position[]`: Array of coordinate points defining the path
 * - `Route`: Complete route object (for route reconstruction scenarios)
 *
 * @example
 * ```typescript
 * // As coordinate array
 * const path1: PathLike = [
 *   [4.9, 52.3],
 *   [4.91, 52.31],
 *   [4.92, 52.32]
 * ];
 *
 * // As existing route
 * const path2: PathLike = existingRoute;
 * ```
 *
 * @group Route
 */
export type PathLike = Position[] | Route;

/**
 * Generic geographic input for route planning.
 *
 * Can be either a waypoint (point location) or a path (line to follow).
 * This flexible type allows mixing different input types in route calculations.
 *
 * @remarks
 * - Use waypoints for origin, destination, and intermediate stops
 * - Use paths for route reconstruction or to force the route along specific roads
 * - A path's own endpoints are sent as waypoints, so a path between two points adds two of them
 *
 * @example
 * ```typescript
 * const locations: RoutePlanningLocation[] = [
 *   [4.9, 52.3],              // Start waypoint
 *   [4.95, 52.35],            // Intermediate stop
 *   existingPathCoordinates,  // Path to follow
 *   [5.0, 52.4]               // End waypoint
 * ];
 * ```
 *
 * @group Route
 */
export type RoutePlanningLocation = WaypointLike | PathLike;

/**
 * Classification of a RoutePlanningLocation by its type.
 *
 * Used internally to distinguish between waypoint and path inputs.
 *
 * @remarks
 * - `waypoint`: Represents a single point location (WaypointLike)
 * - `path`: Represents a path or route to follow (PathLike)
 *
 * @group Route
 */
export type RoutePlanningLocationType = 'waypoint' | 'path';
