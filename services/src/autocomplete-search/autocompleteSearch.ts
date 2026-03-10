import { callService } from '../shared/serviceTemplate';
import type { AutocompleteSearchTemplate } from './autocompleteSearchTemplate';
import { autocompleteSearchTemplate } from './autocompleteSearchTemplate';
import type { AutocompleteSearchParams, AutocompleteSearchResponse } from './types';

/**
 * Autocomplete search queries as the user types, enabling faster and more accurate search.
 *
 * The Autocomplete service recognizes entities (places, addresses, POIs) within a partial
 * input query and offers them as completion suggestions. This enables real-time search
 * assistance and improves the search experience.
 *
 * @remarks
 * Key features:
 * - **Real-time suggestions**: Returns results as the user types
 * - **Entity recognition**: Identifies addresses, POIs, and geographic areas
 * - **Structured results**: Provides both plain text and structured data
 * - **Query refinement**: Helps users formulate more accurate search queries
 * - **Fast response**: Optimized for low-latency interactive use
 *
 * Typical use cases:
 * - Search box autocomplete dropdowns
 * - Address entry forms
 * - Location pickers
 * - Navigation apps
 *
 * @param params - Autocomplete parameters including the partial query
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to autocomplete suggestions
 *
 * @example
 * ```typescript
 * // Autocomplete as user types "amster"
 * const suggestions = await autocompleteSearch({
 *   query: 'amster',
 *   limit: 5
 * });
 * // Returns: Amsterdam, Amsterdam Centraal, etc.
 *
 * // Autocomplete with position bias
 * const localSuggestions = await autocompleteSearch({
 *   query: 'main st',
 *   position: [4.9041, 52.3676],  // Near Amsterdam
 *   limit: 10
 * });
 *
 * // Autocomplete restricted to a country with radius
 * const nlSuggestions = await autocompleteSearch({
 *   query: 'pizz',
 *   countries: ['NL'],
 *   position: [4.9041, 52.3676],
 *   radiusMeters: 5000
 * });
 * ```
 *
 * @see [Autocomplete API Documentation](https://docs.tomtom.com/search-api/documentation/autocomplete-service/autocomplete)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [Search Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/search)
 *
 * @group Autocomplete Search
 */
export const autocompleteSearch = async (
    params: AutocompleteSearchParams,
    customTemplate?: Partial<AutocompleteSearchTemplate>,
): Promise<AutocompleteSearchResponse> =>
    callService(params, { ...autocompleteSearchTemplate, ...customTemplate }, 'Autocomplete');
