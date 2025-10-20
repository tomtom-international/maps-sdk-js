/**
 * Brand information for a POI.
 *
 * Identifies the commercial brand or chain associated with a location.
 * Useful for finding specific franchise locations or filtering by brand.
 *
 * @example
 * ```typescript
 * const brand: Brand = {
 *   name: 'Starbucks'
 * };
 * ```
 *
 * @group Place
 * @category Types
 */
export type Brand = {
    /**
     * Brand name.
     *
     * The commercial or franchise name (e.g., 'McDonald\'s', 'Shell', 'Hilton').
     */
    name: string;
};
