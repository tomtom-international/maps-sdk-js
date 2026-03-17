import type { Route } from '@tomtom-org/maps-sdk/core';
import type { LineString, Position } from 'geojson';
import type { CommonSearchParams } from '../../shared';
import type { AlongRouteSearchRequestAPI } from './alongRouteSearchRequestAPI';
import type { AlongRouteSearchResponseAPI } from './alongRouteSearchResponseAPI';

/**
 * Result sorting order for along-route search.
 *
 * Controls how the returned POIs are ordered relative to the route.
 *
 * @remarks
 * - `detourTime`: Sort by additional travel time required to visit the POI (default)
 * - `detourOffset`: Sort by how far along the route the detour point falls
 *
 * @group Along Route Search
 */
export type AlongRouteSortBy = 'detourTime' | 'detourOffset';

/**
 * Parameters for searching places along a route.
 *
 * Along-route search finds POIs near a provided route geometry and ranks them
 * by the detour cost (time or distance offset) required to visit them.
 *
 * @remarks
 * **Key Features:**
 * - Search for POIs within a detour budget from the route
 * - Sort results by detour time or route offset
 * - Combine with POI category and brand filters
 * - Use directly with a {@link calculateRoute} result
 *
 * **Use Cases:**
 * - Find fuel stations or EV chargers along a trip
 * - Locate rest stops or restaurants near a route
 * - Surface services reachable within a time budget
 *
 * @example
 * ```typescript
 * // Find coffee shops within a 5-minute detour from a route
 * const results = await search({
 *   route: routeResult.features[0],
 *   maxDetourTimeSeconds: 300,
 *   query: 'coffee',
 * });
 *
 * // Find EV charging stations using a plain coordinate array
 * const chargers = await search({
 *   route: [[4.9, 52.37], [4.95, 52.28], [5.1, 52.09]],
 *   maxDetourTimeSeconds: 600,
 *   poiCategories: ['ELECTRIC_VEHICLE_STATION'],
 *   sortBy: 'detourOffset',
 * });
 * ```
 *
 * @group Along Route Search
 */
export type AlongRouteSearchParams = CommonSearchParams<AlongRouteSearchRequestAPI, AlongRouteSearchResponseAPI> & {
    /**
     * Route geometry to search along.
     *
     * Accepts any of three forms:
     * - **`Route`** feature as returned by {@link calculateRoute} (most common)
     * - **`LineString`** GeoJSON geometry object
     * - **`Position[]`** — a plain array of `[longitude, latitude]` coordinate pairs
     *
     * Coordinates must always be in `[longitude, latitude]` order.
     *
     * @example
     * ```typescript
     * // Route Feature from calculateRoute (most common)
     * route: routeResult.features[0]
     *
     * // GeoJSON LineString geometry
     * route: routeResult.features[0].geometry
     *
     * // Plain coordinate array
     * route: [[4.9, 52.37], [4.95, 52.28], [5.1, 52.09]]
     * ```
     */
    route: LineString | Route | Position[];

    /**
     * Maximum allowed detour time in seconds.
     *
     * Only POIs reachable within this additional travel time from the route
     * will be returned. Controls the width of the search corridor.
     *
     * @example
     * ```typescript
     * maxDetourTimeSeconds: 300  // 5-minute detour budget
     * ```
     */
    maxDetourTimeSeconds: number;

    /**
     * Sort order for the results.
     *
     * @default 'detourTime'
     *
     * @example
     * ```typescript
     * sortBy: 'detourOffset'  // order by position along the route
     * ```
     */
    sortBy?: AlongRouteSortBy;
};
