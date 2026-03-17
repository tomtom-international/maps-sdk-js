import type { Place, Places, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { AlongRouteSearchParams } from '../along-route-search';
import { alongRouteSearch } from '../along-route-search/alongRouteSearch';
import type { AlongRouteSearchTemplate } from '../along-route-search/alongRouteSearchTemplate';
import type { FuzzySearchParams, QueryIntent } from '../fuzzy-search';
import { fuzzySearch } from '../fuzzy-search/fuzzySearch';
import type { FuzzySearchTemplate } from '../fuzzy-search/fuzzySearchTemplate';
import type { GeometrySearchParams } from '../geometry-search';
import { geometrySearch } from '../geometry-search/geometrySearch';
import type { GeometrySearchTemplate } from '../geometry-search/geometrySearchTemplate';
import type { SearchSummary } from '../shared';

type SearchFeatureCollectionProps = SearchSummary & {
    queryIntent?: QueryIntent[];
};

/**
 * Search service response containing places that match the query.
 *
 * Collection of place features with search-specific properties like relevance scores and distances.
 *
 * @group Search
 */
export type SearchResponse = Places<SearchPlaceProps, SearchFeatureCollectionProps>;

/**
 * Universal search function for finding places by text query or within geometries.
 *
 * This is a unified interface that automatically routes to either:
 * - **Geometry Search**: When geometries parameter is provided (search within specific areas)
 * - **Fuzzy Search**: When no geometries provided (free-text search)
 *
 * @remarks
 * The search service provides:
 * - POI (Points of Interest) search
 * - Address search
 * - Geographic area search
 * - Category-based filtering
 * - Position-based relevance ranking
 *
 * Results are ranked by relevance with scores and optional distances.
 *
 * @param params - Search parameters (either GeometrySearchParams or FuzzySearchParams)
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to a collection of matching places
 *
 * @example
 * ```typescript
 * // Free-text search near a location
 * const results = await search({
 *   query: 'pizza restaurant',
 *   position: [4.9041, 52.3676],  // Amsterdam
 *   limit: 10
 * });
 *
 * // Search within a specific area
 * const areaResults = await search({
 *   query: 'coffee shop',
 *   geometries: [polygon],  // Search within this polygon
 *   limit: 20
 * });
 *
 * // Category search
 * const restaurants = await search({
 *   poiCategories: ['ITALIAN_RESTAURANT'],
 *   position: [4.9041, 52.3676],
 *   radiusMeters: 5000  // Within 5km
 * });
 * ```
 *
 * @see [Search API Documentation](https://docs.tomtom.com/search-api/documentation/search-service/search-service)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Search Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/search)
 *
 * @group Search
 */
export const search = async (
    params: GeometrySearchParams | FuzzySearchParams | AlongRouteSearchParams,
    customTemplate?: Partial<GeometrySearchTemplate | FuzzySearchTemplate | AlongRouteSearchTemplate>,
): Promise<SearchResponse> => {
    if ('route' in params) return alongRouteSearch(params, customTemplate as Partial<AlongRouteSearchTemplate>);
    if ('geometries' in params) return geometrySearch(params, customTemplate as Partial<GeometrySearchTemplate>);
    return fuzzySearch(params, customTemplate as Partial<FuzzySearchTemplate>);
};

/**
 * Search for a single place by text query.
 *
 * Convenience function that calls {@link search} and returns the first result.
 * Throws an error if no results are found.
 *
 * @param query - Search query string
 * @returns Promise resolving to the first matching place
 * @throws {Error} If no results are found for the query
 *
 * @example
 * ```typescript
 * const place = await searchOne('Vondelpark Amsterdam');
 * console.log(place.properties.poi?.name);
 * ```
 *
 * @remarks
 * * Useful to quickly find a single place, particularly a POI.
 * * If you want to find a single address, consider 'geocodeOne'.
 *
 * @group Search
 */
export const searchOne = async (query: string): Promise<Place<SearchPlaceProps>> => {
    const result = await search({ query, limit: 1 });
    if (!result.features[0]) throw new Error(`searchOne: no results found for "${query}"`);
    return result.features[0];
};
