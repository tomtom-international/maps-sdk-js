import { callService } from '../shared/serviceTemplate';
import type { GeometrySearchTemplate } from './geometrySearchTemplate';
import { geometrySearchTemplate } from './geometrySearchTemplate';
import type { GeometrySearchParams, GeometrySearchResponse } from './types';

/**
 * Search for places within specific geographic boundaries.
 *
 * The Geometry Search service finds places that fall within one or more defined areas,
 * such as polygons, circles, or corridors. This is essential for location-based filtering
 * and spatial queries where you need results constrained to specific regions.
 *
 * @remarks
 * Key features:
 * - **Area-based search**: Find places within polygons, circles, or along routes
 * - **Multiple geometries**: Search across several areas simultaneously
 * - **Precise boundaries**: Only returns results within the specified areas
 * - **Combined with text**: Filter by query text within the geometric boundaries
 * - **Category filtering**: Narrow results by POI categories
 *
 * Common use cases:
 * - **Route-based search**: "Find gas stations along my route"
 * - **Area filtering**: "Restaurants within this neighborhood polygon"
 * - **Corridor search**: "Hotels within 5km of the highway"
 * - **Service areas**: "Stores within our delivery zone"
 * - **Geofencing**: Places within administrative or custom boundaries
 *
 * @param params Geometry search parameters including geometries and optional query
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to places within the specified geometries
 *
 * @example
 * ```typescript
 * // Search within a polygon (neighborhood boundaries)
 * const inArea = await geometrySearch({
 *   key: 'your-api-key',
 *   query: 'coffee shop',
 *   geometries: [{
 *     type: 'Polygon',
 *     coordinates: [[
 *       [4.88, 52.36],
 *       [4.90, 52.36],
 *       [4.90, 52.38],
 *       [4.88, 52.38],
 *       [4.88, 52.36]
 *     ]]
 *   }]
 * });
 *
 * // Find POIs along a route corridor
 * const alongRoute = await geometrySearch({
 *   key: 'your-api-key',
 *   query: 'gas station',
 *   geometries: [routeLineString],  // From calculateRoute result
 *   geometryList: [{
 *     position: 0,
 *     radius: 5000  // 5km corridor along route
 *   }]
 * });
 *
 * // Search multiple areas at once
 * const multiArea = await geometrySearch({
 *   key: 'your-api-key',
 *   query: 'pharmacy',
 *   geometries: [polygonA, polygonB, polygonC],
 *   limit: 20
 * });
 *
 * // Category search within geometry
 * const restaurants = await geometrySearch({
 *   key: 'your-api-key',
 *   categorySet: [7315],  // Restaurant category
 *   geometries: [cityBoundary]
 * });
 * ```
 *
 * @see [Geometry Search API Documentation](https://docs.tomtom.com/search-api/documentation/search-service/geometry-search)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Search Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/search)
 *
 * @group Search
 * @category Functions
 */
export const geometrySearch = async (
    params: GeometrySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate>,
): Promise<GeometrySearchResponse> =>
    callService(params, { ...geometrySearchTemplate, ...customTemplate }, 'GeometrySearch');

export default geometrySearch;
