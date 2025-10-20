import type { Position } from 'geojson';

/**
 * Query type classification for search results.
 *
 * Indicates whether the search was location-based or general.
 *
 * @remarks
 * - `NEARBY`: Results are based on proximity to a specified location (uses `at` parameter)
 * - `NON_NEAR`: General search without location bias, or results span a wide area
 *
 * @group Search
 * @category Types
 */
type SummaryQueryType = 'NEARBY' | 'NON_NEAR';

/**
 * Metadata summary for search API responses.
 *
 * Provides information about the search query execution, result counts,
 * and pagination details. This metadata helps understand how the search
 * was processed and manage result navigation.
 *
 * @remarks
 * This summary is included in responses from:
 * - {@link search}
 * - {@link fuzzySearch}
 * - {@link geometrySearch}
 * - {@link autocompleteSearch}
 *
 * @example
 * ```typescript
 * const results = await search({
 *   key: 'your-api-key',
 *   query: 'pizza',
 *   at: [4.9, 52.3]
 * });
 *
 * const summary = results.summary;
 * console.log(`Found ${summary.totalResults} total results`);
 * console.log(`Showing ${summary.numResults} results`);
 * console.log(`Query type: ${summary.queryType}`); // 'NEARBY'
 * console.log(`Search took ${summary.queryTime}ms`);
 * ```
 *
 * @group Search
 * @category Types
 */
export type SearchSummary = {
    /**
     * The search query as interpreted and processed by the search engine.
     *
     * May differ from the original input due to:
     * - Normalization (case, spacing, diacritics)
     * - Spelling corrections
     * - Query expansion
     * - Stop word removal
     *
     * @example
     * ```typescript
     * // User input: "pizzza restaurant"
     * query: "pizza restaurant"  // Corrected spelling
     * ```
     */
    query: string;

    /**
     * Classification of the search type.
     *
     * Indicates whether results are location-biased (NEARBY) or general (NON_NEAR).
     */
    queryType: SummaryQueryType;

    /**
     * Query processing time in milliseconds.
     *
     * Time spent by the search engine to process and return results.
     * Does not include network latency.
     *
     * @example
     * ```typescript
     * queryTime: 42  // Search took 42ms to execute
     * ```
     */
    queryTime: number;

    /**
     * Number of results included in this response.
     *
     * This is the actual count of features in the results array,
     * which may be less than `totalResults` due to pagination limits.
     *
     * @remarks
     * Controlled by the `limit` parameter in the search request.
     *
     * @example
     * ```typescript
     * // If limit=10 and totalResults=50
     * numResults: 10  // Only 10 results in this response
     * totalResults: 50  // 50 total matches exist
     * ```
     */
    numResults: number;

    /**
     * Starting position of these results within the complete result set.
     *
     * Zero-based index indicating where this page of results begins.
     * Used for pagination to retrieve subsequent pages.
     *
     * @remarks
     * Set using the `offset` parameter in the search request.
     *
     * @example
     * ```typescript
     * // First page (results 0-9)
     * offset: 0, numResults: 10
     *
     * // Second page (results 10-19)
     * offset: 10, numResults: 10
     *
     * // Third page (results 20-29)
     * offset: 20, numResults: 10
     * ```
     */
    offset: number;

    /**
     * Total number of matching results found by the search.
     *
     * The complete count of all results that match the query,
     * regardless of pagination limits.
     *
     * @remarks
     * Use this with `offset` and `numResults` to implement pagination:
     * - Current page: `offset / limit + 1`
     * - Total pages: `Math.ceil(totalResults / limit)`
     * - Has more results: `offset + numResults < totalResults`
     *
     * @example
     * ```typescript
     * totalResults: 50  // 50 total matches found
     * numResults: 10    // Showing first 10
     * offset: 0         // Starting from beginning
     *
     * // Can fetch more with offset: 10, 20, 30, 40
     * ```
     */
    totalResults: number;

    /**
     * Maximum fuzzy matching level used to find results.
     *
     * Indicates how much the search relaxed exact matching to find results.
     * Higher values mean more tolerance for typos and variations.
     *
     * @remarks
     * Fuzzy levels (typically 1-4):
     * - 1: Single character variation (typo, insertion, deletion)
     * - 2: Two character variations
     * - 3: Three character variations
     * - 4: Four character variations
     *
     * If results are found with exact or near-exact matching, this will be low.
     * If the query has typos, this increases to find matches.
     *
     * @example
     * ```typescript
     * // Query: "amstrdam" (typo)
     * fuzzyLevel: 2  // Needed 2-character correction to match "amsterdam"
     *
     * // Query: "amsterdam" (correct)
     * fuzzyLevel: 0  // Exact match, no fuzzy matching needed
     * ```
     */
    fuzzyLevel: number;

    /**
     * Geographic position used to bias search results.
     *
     * When present, indicates that results were prioritized based on
     * proximity to this location. Format: [longitude, latitude]
     *
     * @remarks
     * This reflects the position from:
     * - The `at` parameter (explicit position bias)
     * - The `in` parameter (area center, if applicable)
     * - Automatic geolocation (if enabled)
     *
     * Results closer to this position are ranked higher.
     *
     * @example
     * ```typescript
     * // Search biased toward Amsterdam
     * geoBias: [4.9041, 52.3676]  // [longitude, latitude]
     *
     * // Query: "Main Street" will prioritize Main Streets near Amsterdam
     * ```
     */
    geoBias?: Position;
};
