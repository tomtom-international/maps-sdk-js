import type { HasLngLat } from '@cet/maps-sdk-js/core';
import type { CommonServiceParams } from '../../shared';
import type { AutocompleteSearchResponseAPI } from './autocompleteSearchResponseAPI';

/**
 * Segment type for autocomplete results.
 *
 * Determines the type of entity being suggested in autocomplete results.
 *
 * @remarks
 * **Segment Types:**
 * - `brand`: Chain or brand names (e.g., "McDonald's", "Starbucks")
 * - `category`: POI categories (e.g., "Restaurant", "Gas Station")
 * - `plaintext`: Free-form text (addresses, place names)
 *
 * @example
 * ```typescript
 * // Filter for brand results only
 * const resultType: AutocompleteSearchSegmentType[] = ['brand'];
 *
 * // Filter for categories and brands
 * const resultType: AutocompleteSearchSegmentType[] = ['category', 'brand'];
 * ```
 *
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteSearchSegmentType = 'brand' | 'category' | 'plaintext';

/**
 * Parameters for autocomplete search suggestions.
 *
 * Provides real-time search suggestions as users type, recognizing entities like
 * places, addresses, brands, and categories within partial input.
 *
 * @remarks
 * **Key Features:**
 * - Real-time suggestions as user types
 * - Entity recognition (brands, categories, addresses)
 * - Position-based relevance ranking
 * - Country and area filtering
 * - Type-based result filtering
 *
 * **Use Cases:**
 * - Search box autocomplete dropdowns
 * - Address entry assistance
 * - Navigation input fields
 * - Location pickers
 *
 * @example
 * ```typescript
 * // Basic autocomplete
 * const params: AutocompleteSearchParams = {
 *   key: 'your-api-key',
 *   query: 'pizz',
 *   limit: 5
 * };
 *
 * // Autocomplete with position bias
 * const biasedParams: AutocompleteSearchParams = {
 *   key: 'your-api-key',
 *   query: 'coffee',
 *   position: [4.9041, 52.3676],  // Near Amsterdam
 *   radiusMeters: 5000,
 *   limit: 10
 * };
 *
 * // Filter by result type
 * const brandParams: AutocompleteSearchParams = {
 *   key: 'your-api-key',
 *   query: 'mcdon',
 *   resultType: ['brand'],  // Only brand suggestions
 *   countries: ['NL', 'BE']  // Netherlands and Belgium only
 * };
 * ```
 *
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteSearchParams = CommonServiceParams<URL, AutocompleteSearchResponseAPI> & {
    /**
     * Search query string (partial user input).
     *
     * The text to autocomplete. Can be incomplete or partial words.
     *
     * @remarks
     * Must be properly URL encoded. The service will match this against
     * place names, addresses, brands, and categories.
     *
     * @example
     * ```typescript
     * query: 'amster'  // Will suggest "Amsterdam"
     * query: 'star'    // Will suggest "Starbucks" (brand) or "Main Street" (address)
     * ```
     */
    query: string;

    /**
     * Position to bias results towards.
     *
     * Results closer to this location will be ranked higher in suggestions.
     *
     * @remarks
     * Can be provided as:
     * - Object with `lon` and `lat` properties
     * - Array `[longitude, latitude]`
     *
     * When used without `radiusMeters`, biases results but doesn't restrict them.
     * When used with `radiusMeters`, constrains results to that area.
     *
     * @example
     * ```typescript
     * // Object format
     * position: { lon: 4.9041, lat: 52.3676 }
     *
     * // Array format
     * position: [4.9041, 52.3676]
     * ```
     */
    position?: HasLngLat;

    /**
     * Maximum number of suggestions to return.
     *
     * @default 10
     * @minimum 1
     * @maximum 100
     *
     * @example
     * ```typescript
     * limit: 5  // Return up to 5 suggestions
     * ```
     */
    limit?: number;

    /**
     * Search radius in meters from the position.
     *
     * When combined with `position`, restricts results to within this radius.
     * Without `position`, this parameter is ignored.
     *
     * @remarks
     * Only results within this distance from `position` will be returned.
     * Values ≤ 0 are ignored.
     *
     * @example
     * ```typescript
     * // Search within 5km of position
     * position: [4.9, 52.3],
     * radiusMeters: 5000
     * ```
     */
    radiusMeters?: number;

    /**
     * Restrict results to specific countries.
     *
     * List of country codes in ISO 3166-1 alpha-2 or alpha-3 format.
     *
     * @remarks
     * Only places within these countries will be suggested.
     * Useful for region-specific applications.
     *
     * @example
     * ```typescript
     * // Alpha-2 codes
     * countries: ['US', 'CA', 'MX']
     *
     * // Alpha-3 codes
     * countries: ['USA', 'CAN', 'MEX']
     *
     * // European countries
     * countries: ['NL', 'DE', 'FR', 'BE']
     * ```
     */
    countries?: string[];

    /**
     * Filter results by segment type.
     *
     * Restricts suggestions to specific entity types (brands, categories, or plaintext).
     *
     * @remarks
     * A result is only included if it contains segments of the specified types.
     * Omit this parameter to receive all types.
     *
     * @example
     * ```typescript
     * // Only brand suggestions (e.g., "Starbucks", "McDonald's")
     * resultType: ['brand']
     *
     * // Only category suggestions (e.g., "Restaurant", "Hotel")
     * resultType: ['category']
     *
     * // Brands and categories, exclude addresses
     * resultType: ['brand', 'category']
     *
     * // All types (default)
     * resultType: ['brand', 'category', 'plaintext']
     * ```
     */
    resultType?: AutocompleteSearchSegmentType[];
};
