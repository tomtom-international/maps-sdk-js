import type { Places, SearchPlaceProps } from '@tomtom-org/maps-sdk-js/core';
import type { FuzzySearchParams, QueryIntent } from '../fuzzy-search';
import { fuzzySearch } from '../fuzzy-search';
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
 *   key: 'your-api-key',
 *   query: 'pizza restaurant',
 *   at: [4.9041, 52.3676],  // Amsterdam
 *   limit: 10
 * });
 *
 * // Search within a specific area
 * const areaResults = await search({
 *   key: 'your-api-key',
 *   query: 'coffee shop',
 *   geometries: [polygon],  // Search within this polygon
 *   limit: 20
 * });
 *
 * // Category search
 * const restaurants = await search({
 *   key: 'your-api-key',
 *   query: 'restaurant',
 *   categorySet: [7315],  // Restaurant category
 *   at: [4.9041, 52.3676],
 *   radius: 5000  // Within 5km
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
    params: GeometrySearchParams | FuzzySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate | FuzzySearchTemplate>,
): Promise<SearchResponse> =>
    'geometries' in params
        ? geometrySearch(params, customTemplate as GeometrySearchTemplate)
        : fuzzySearch(params, customTemplate as FuzzySearchTemplate);
