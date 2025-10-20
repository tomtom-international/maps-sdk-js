/**
 * Filter mode determining whether to include or exclude specified values.
 *
 * @remarks
 * Controls how the values list is interpreted:
 * - `all_except`: Show everything except the specified values (exclusion mode)
 * - `only`: Show only the specified values, hide everything else (inclusion mode)
 *
 * @example
 * ```typescript
 * // Exclusion mode
 * const mode: FilterShowMode = 'all_except';
 *
 * // Inclusion mode
 * const mode: FilterShowMode = 'only';
 * ```
 *
 * @group Shared
 * @category Types
 */
export type FilterShowMode = 'all_except' | 'only';

/**
 * Generic filter configuration for showing or hiding items by value.
 *
 * Provides a flexible way to control visibility of categorized items (e.g., POI categories,
 * layer groups, road types) using either inclusion or exclusion mode.
 *
 * @typeParam T - The type of values being filtered (e.g., string literals, enums)
 *
 * @remarks
 * **Filter Modes:**
 * - `only`: Whitelist mode - only specified values are shown
 * - `all_except`: Blacklist mode - all values except specified ones are shown
 *
 * **Common Use Cases:**
 * - Filtering POI categories (show only restaurants)
 * - Hiding map layer groups (hide all except roads)
 * - Filtering traffic incidents by type
 * - Controlling road categories in traffic flow
 *
 * @example
 * ```typescript
 * // Show only specific categories
 * const includeFilter: ValuesFilter<string> = {
 *   show: 'only',
 *   values: ['RESTAURANT', 'CAFE', 'BAR']
 * };
 *
 * // Hide specific categories
 * const excludeFilter: ValuesFilter<string> = {
 *   show: 'all_except',
 *   values: ['PARKING_GARAGE']
 * };
 *
 * // Type-safe with string literals
 * type RoadType = 'motorway' | 'trunk' | 'primary';
 * const roadFilter: ValuesFilter<RoadType> = {
 *   show: 'only',
 *   values: ['motorway', 'trunk']
 * };
 * ```
 *
 * @group Shared
 * @category Types
 */
export type ValuesFilter<T> = {
    /**
     * Filter mode determining whether values list is inclusive or exclusive.
     *
     * @remarks
     * - `only`: Shows only the items in the values array (whitelist)
     * - `all_except`: Shows all items except those in the values array (blacklist)
     */
    show: FilterShowMode;

    /**
     * Array of values to include or exclude based on the show mode.
     *
     * @remarks
     * The interpretation of this array depends on the `show` property:
     * - If `show` is `'only'`, only these values will be visible
     * - If `show` is `'all_except'`, these values will be hidden
     *
     * @example
     * ```typescript
     * // Include only these values
     * values: ['RESTAURANT', 'HOTEL']
     *
     * // Exclude these values
     * values: ['PARKING']
     * ```
     */
    values: T[];
};
