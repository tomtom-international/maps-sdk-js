import type { WaypointLike } from '@tomtom-org/maps-sdk/core';

/**
 * Waypoint or placeholder for route planning.
 *
 * Represents a point along a route, which can be a full waypoint with position
 * and properties, or `null` for placeholder positions (e.g., unset waypoints in
 * a multi-stop route planner UI).
 *
 * @remarks
 * **Use Cases:**
 * - Route planning interfaces with add/remove waypoint functionality
 * - Multi-stop delivery route optimization
 * - Placeholder slots in waypoint arrays
 * - Optional intermediate stops
 *
 * **Waypoint Types:**
 * - `WaypointLike`: Full waypoint with coordinates and optional properties
 * - `null`: Placeholder for unset or removed waypoints
 *
 * @example
 * ```typescript
 * // Array of waypoints with some unset
 * const waypoints: PlanningWaypoint[] = [
 *   { type: 'Feature', geometry: { type: 'Point', coordinates: [4.9, 52.3] } },
 *   null,  // Empty slot for user to add waypoint
 *   { type: 'Feature', geometry: { type: 'Point', coordinates: [4.5, 51.9] } }
 * ];
 *
 * // Filter out null waypoints before routing
 * const validWaypoints = waypoints.filter(w => w !== null);
 * ```
 *
 * @group Routing
 */
export type PlanningWaypoint = WaypointLike | null;
