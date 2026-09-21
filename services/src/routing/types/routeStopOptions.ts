import type { HasLngLat } from '@tomtom-org/maps-sdk/core';
import type { CostModel } from '../../shared';

/**
 * Cost model overrides that apply to a single leg of a route.
 *
 * @remarks
 * A subset of {@link CostModel}: only the route type and the avoid list can vary per leg.
 * Traffic, avoid areas and departure time are route-wide.
 *
 * @group Routing
 */
export type LegCostModel = Pick<CostModel, 'routeType' | 'avoid'>;

/**
 * Per-stop routing options, carried on the `properties` of a route stop.
 *
 * Attach these to any waypoint in {@link CalculateRouteParams.locations} to control how the
 * route reaches that stop, and how long it waits there.
 *
 * @remarks
 * **Leg attribution.** Options describe the leg *arriving at* this stop. Reading them that way
 * is what keeps them attached to the right stop when another stop is inserted earlier in the
 * list. `legCostModel` on the origin has no leg to describe and is ignored.
 *
 * **The wait at a stop** is {@link WaypointProps.pauseDurationSeconds}, which every waypoint
 * carries — the map reads it too, to label the stop's pin.
 *
 * **Entry points.** Explicit `candidateEntryPoints` hand the routing engine a set of approach
 * points and let it choose; this takes precedence over the route-wide
 * {@link CalculateRouteParams.useEntryPoints}, which only resolves a single position
 * client-side.
 *
 * @example
 * ```typescript
 * import type { Waypoint } from '@tomtom-org/maps-sdk/core';
 * import type { RouteStopOptions } from '@tomtom-org/maps-sdk/services';
 *
 * const stop: Waypoint<RouteStopOptions> = {
 *     type: 'Feature',
 *     geometry: { type: 'Point', coordinates: [4.7, 52.1] },
 *     properties: {
 *         // wait 20 minutes at this stop
 *         pauseDurationSeconds: 1200,
 *         // reach this stop without using motorways
 *         legCostModel: { routeType: 'short', avoid: ['motorways'] },
 *     },
 * };
 *
 * const route = await calculateRoute({ locations: [origin, stop, destination] });
 * ```
 *
 * @group Routing
 */
export type RouteStopOptions = {
    /**
     * Candidate approach points for this stop, for the routing engine to choose between.
     *
     * @remarks
     * Use this when a place has several usable entrances and you want the engine to pick the one
     * that suits the route, rather than resolving a single entry point yourself. Takes precedence
     * over {@link CalculateRouteParams.useEntryPoints} for this stop.
     *
     * Deliberately not called `entryPoints`: a {@link Place} already carries `entryPoints` of its
     * own in `properties`, describing entrances found by search, and those are not sent to the
     * routing API. These are positions you choose to offer the router.
     *
     * @example
     * ```typescript
     * // Let the router choose between the main and the delivery entrance
     * candidateEntryPoints: [[4.701, 52.101], [4.703, 52.099]]
     * ```
     */
    candidateEntryPoints?: HasLngLat[];

    /**
     * Index into {@link RouteStopOptions.candidateEntryPoints} of the preferred approach point.
     *
     * @remarks
     * The routing engine uses this entry point unless another one produces a materially better
     * route. Ignored when `candidateEntryPoints` is not set.
     */
    preferredEntryPointIndex?: number;

    /**
     * Cost model overrides for the leg *arriving at* this stop.
     *
     * @remarks
     * Falls back to the route-wide {@link CostModel} for anything not set here. Ignored on the
     * origin, which has no arriving leg.
     *
     * @example
     * ```typescript
     * // Take the scenic way to this one stop
     * legCostModel: { routeType: 'thrilling', avoid: ['motorways'] }
     * ```
     */
    legCostModel?: LegCostModel;
};
