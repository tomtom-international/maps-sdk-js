import { callService } from '../shared/serviceTemplate';
import type { FuzzySearchTemplate } from './fuzzySearchTemplate';
import { fuzzySearchTemplate } from './fuzzySearchTemplate';
import type { FuzzySearchParams, FuzzySearchResponse } from './types';

/**
 * Search for places using free-text queries with fuzzy matching.
 *
 * The Fuzzy Search service provides a flexible search that handles typos, abbreviations,
 * and incomplete addresses. It searches across POIs (Points of Interest), addresses,
 * and geographic areas to find the best matches for your query.
 *
 * @remarks
 * Key features:
 * - **Typo tolerance**: Handles misspellings and typing errors
 * - **Partial matching**: Works with incomplete queries
 * - **Multi-category search**: Searches POIs, addresses, and places simultaneously
 * - **Position bias**: Prioritizes results near a given location
 * - **Flexible input**: Accepts natural language queries
 *
 * The service is ideal for:
 * - User-facing search boxes where typos are common
 * - Location lookup without knowing exact names
 * - General "find anything" search functionality
 * - Autocomplete with final selection
 *
 * @param params Fuzzy search parameters including the search query
 * @param customTemplate Advanced customization for request/response handling
 *
 * @returns Promise resolving to a collection of matching places
 *
 * @example
 * ```typescript
 * // Basic search with typo tolerance
 * const results = await fuzzySearch({
 *   query: 'amstrdam'  // Typo: missing 'e'
 * });
 * // Still finds "Amsterdam"
 *
 * // Search near a specific location
 * const nearby = await fuzzySearch({
 *   query: 'pizza',
 *   position: [4.9041, 52.3676],  // Amsterdam
 *   radiusMeters: 2000,  // Within 2km
 *   limit: 10
 * });
 *
 * // Search with category filter
 * const restaurants = await fuzzySearch({
 *   poiCategories: ['ITALIAN_RESTAURANT'],
 *   position: [4.9041, 52.3676]
 * });
 *
 * // Partial address search restricted to a country
 * const addresses = await fuzzySearch({
 *   query: '123 main st',
 *   countries: ['US'],
 *   limit: 5
 * });
 * ```
 *
 * @see [Fuzzy Search API Documentation](https://docs.tomtom.com/search-api/documentation/search-service/fuzzy-search)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Search Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/search)
 *
 * @ignore (exposed via 'search')
 */
export const fuzzySearch = async (
    params: FuzzySearchParams,
    customTemplate?: Partial<FuzzySearchTemplate>,
): Promise<FuzzySearchResponse> => callService(params, { ...fuzzySearchTemplate, ...customTemplate }, 'FuzzySearch');
