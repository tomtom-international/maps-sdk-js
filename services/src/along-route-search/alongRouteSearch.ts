import { callService } from '../shared/serviceTemplate';
import type { AlongRouteSearchTemplate } from './alongRouteSearchTemplate';
import { alongRouteSearchTemplate } from './alongRouteSearchTemplate';
import type { AlongRouteSearchParams, AlongRouteSearchResponse } from './types';

/**
 * Search for places along a route, ranked by detour cost.
 *
 * Returns POIs reachable within a given detour budget from the provided route geometry.
 * Results are sorted by detour time (or offset along the route) so the most
 * accessible stops appear first.
 *
 * @remarks
 * This service is ideal for trip planning use cases:
 * - Find fuel or EV charging stations along the way
 * - Locate food stops or rest areas near the route
 * - Surface services reachable within a time budget
 *
 * The `route` is typically sourced from a {@link calculateRoute} result.
 *
 * @param params Along-route search parameters including the route geometry and detour budget
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to a collection of matching places sorted by detour cost
 *
 * @example
 * ```typescript
 * // Find coffee shops within a 5-minute detour
 * const results = await alongRouteSearch({
 *   route: routeResult.features[0].geometry,
 *   maxDetourTime: 300,
 *   query: 'coffee',
 * });
 *
 * // EV chargers with a 10-minute budget, sorted by position on route
 * const chargers = await alongRouteSearch({
 *   route: routeResult.features[0].geometry,
 *   maxDetourTime: 600,
 *   poiCategories: ['ELECTRIC_VEHICLE_STATION'],
 *   sortBy: 'detourOffset',
 * });
 * ```
 *
 * @see [Along Route Search API Documentation](https://docs.tomtom.com/search-api/documentation/tomtom-orbis-maps/search-service/along-route-search)
 *
 * @ignore (exposed via 'search')
 */
export const alongRouteSearch = async (
    params: AlongRouteSearchParams,
    customTemplate?: Partial<AlongRouteSearchTemplate>,
): Promise<AlongRouteSearchResponse> =>
    callService(params, { ...alongRouteSearchTemplate, ...customTemplate }, 'AlongRouteSearch');
