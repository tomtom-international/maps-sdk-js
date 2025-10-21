import type { CommonGeocodeAndFuzzySearchParams, CommonSearchParams } from '../../shared';
import type { FuzzySearchResponseAPI } from './fuzzySearchResponseAPI';

/**
 * Parameters for fuzzy search queries.
 *
 * Fuzzy search finds places and addresses using partial or misspelled text queries.
 * It's designed to handle typos, abbreviations, and incomplete input gracefully.
 *
 * @remarks
 * **Key Features:**
 * - Tolerates typos and spelling mistakes
 * - Handles partial queries and abbreviations
 * - Searches both addresses and POIs
 * - Configurable fuzziness levels for precision control
 * - Ranked results by relevance
 *
 * **Use Cases:**
 * - Search box implementations
 * - User-entered free-form text searches
 * - Recovery from autocomplete failures
 * - Broad exploratory searches
 *
 * @example
 * ```typescript
 * // Basic fuzzy search
 * const params: FuzzySearchParams = {
 *   key: 'your-api-key',
 *   query: 'pizz',  // Will find "pizza" restaurants
 *   at: [4.9041, 52.3676]
 * };
 *
 * // Fuzzy search with custom fuzziness
 * const customParams: FuzzySearchParams = {
 *   key: 'your-api-key',
 *   query: 'restaurnt',  // Misspelled "restaurant"
 *   minFuzzyLevel: 1,
 *   maxFuzzyLevel: 3,
 *   limit: 10
 * };
 * ```
 *
 * @group Search
 */
export type FuzzySearchParams = CommonSearchParams<URL, FuzzySearchResponseAPI> &
    CommonGeocodeAndFuzzySearchParams & {
        /**
         * Minimum fuzziness level to be used.
         *
         * Controls how tolerant the search is to character differences.
         * Lower values require closer matches to the query text.
         *
         * @remarks
         * Fuzziness levels correspond to Levenshtein edit distance:
         * - Level 1: Allows 1 character difference
         * - Level 2: Allows 2 character differences
         * - Level 3: Allows 3 character differences
         * - Level 4: Allows 4 character differences
         *
         * Higher minimum levels make the search more lenient but may return
         * less relevant results.
         *
         * @default 1
         * @minimum 1
         * @maximum 4
         *
         * @example
         * ```typescript
         * minFuzzyLevel: 2  // Require at least moderate similarity
         * ```
         */
        minFuzzyLevel?: number;

        /**
         * Maximum fuzziness level to be used.
         *
         * Controls the upper limit of tolerance for character differences.
         * Higher values allow more variations but may include irrelevant results.
         *
         * @remarks
         * The search will try increasingly fuzzy matching up to this level
         * if no results are found at lower levels.
         *
         * @default 2
         * @minimum 1
         * @maximum 4
         *
         * @example
         * ```typescript
         * // Allow very fuzzy matching
         * maxFuzzyLevel: 4
         *
         * // Strict matching only
         * maxFuzzyLevel: 1
         * ```
         */
        maxFuzzyLevel?: number;
    };
