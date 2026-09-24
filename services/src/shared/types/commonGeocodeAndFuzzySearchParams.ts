import type { GeoBias } from './geoBias';

/**
 * Common parameters shared between fuzzy search and geocoding services.
 *
 * These parameters control search behavior that applies to both fuzzy search
 * and geocoding operations, including autocomplete mode, pagination, and geographic filtering.
 *
 * @remarks
 * Used by:
 * - {@link fuzzySearch}
 * - {@link geocode}
 *
 * @group Search
 */
export type CommonGeocodeAndFuzzySearchParams = {
    /**
     * Enable predictive/autocomplete mode for partial input queries.
     *
     * When true, the query is treated as incomplete text being typed by a user,
     * and the search returns suggestions that match the partial input.
     *
     * @remarks
     * **Autocomplete Behavior:**
     * - Optimized for real-time search-as-you-type
     * - Returns results that start with or contain the query
     * - Better for interactive search boxes
     * - Lower result quality thresholds to show more options
     *
     * **Regular Search (false):**
     * - Treats query as complete input
     * - Higher quality thresholds
     * - Better for final search submission
     *
     * @default false
     *
     * @example
     * ```typescript
     * // Autocomplete mode for "Amst" input
     * typeahead: true   // Returns: Amsterdam, Amstelveen, etc.
     *
     * // Regular search mode
     * typeahead: false  // Expects complete query
     * ```
     */
    typeahead?: boolean;

    /**
     * Starting position within the complete result set for pagination.
     *
     * Use with `limit` to implement pagination through large result sets.
     * Zero-based index indicating which result to start from.
     *
     * @remarks
     * **Pagination Pattern:**
     * - Page 1: `offset: 0, limit: 10` (results 0-9)
     * - Page 2: `offset: 10, limit: 10` (results 10-19)
     * - Page 3: `offset: 20, limit: 10` (results 20-29)
     *
     * **Performance Note:**
     * Very high offset values may have slower performance.
     *
     * @default 0
     *
     * @example
     * ```typescript
     * // First page
     * offset: 0
     *
     * // Second page (assuming limit: 10)
     * offset: 10
     *
     * // Third page
     * offset: 20
     * ```
     */
    offset?: number;

    /**
     * Where to look: a point with an optional radius, or a bounding box.
     *
     * @remarks
     * A point without `radiusMeters` biases the ranking; with one, or with a `boundingBox`, results
     * are confined to that area. Leave it out to search without a geographic bias.
     *
     * @example
     * ```typescript
     * geoBias: { position: [4.9, 52.3], radiusMeters: 2000 }
     * geoBias: { boundingBox: [4.8, 52.3, 5.0, 52.4] }
     * ```
     */
    geoBias?: GeoBias;

    /**
     * Restrict search to specific countries.
     *
     * Limits results to locations within the specified countries only.
     * Useful for country-specific searches or compliance requirements.
     *
     * @remarks
     * **Country Code Formats:**
     * - ISO 3166-1 alpha-2: Two-letter codes (e.g., "US", "FR", "DE")
     * - ISO 3166-1 alpha-3: Three-letter codes (e.g., "USA", "FRA", "DEU")
     * - Can mix formats: `["US", "FRA", "DE"]`
     *
     * **Behavior:**
     * - Multiple countries create OR condition (results from any listed country)
     * - Case-insensitive
     * - The `view` parameter may affect available countries
     *
     * **Use Cases:**
     * - Regional applications (EU-only, North America-only)
     * - Compliance with data sovereignty rules
     * - Simplifying results for specific markets
     *
     * @example
     * ```typescript
     * // Single country (United States)
     * countries: ['US']
     *
     * // Multiple countries (Europe)
     * countries: ['FR', 'DE', 'NL', 'BE']
     *
     * // Mixed formats
     * countries: ['US', 'GBR', 'CA']
     *
     * // North America
     * countries: ['USA', 'CAN', 'MEX']
     * ```
     */
    countries?: string[];
};
