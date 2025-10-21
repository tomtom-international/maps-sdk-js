/**
 * Optional parameters when showing routes on the map.
 *
 * Controls which route is initially selected when displaying multiple route
 * alternatives on the map.
 *
 * @remarks
 * When multiple routes are displayed (e.g., fastest vs shortest), one route
 * is typically shown as "selected" (highlighted) while others are "deselected"
 * (dimmed). This type controls which route gets the selected state.
 *
 * @example
 * ```typescript
 * // Show first route as selected (default)
 * const options: ShowRoutesOptions = {
 *   selectedIndex: 0
 * };
 *
 * // Show second route as selected
 * const altOptions: ShowRoutesOptions = {
 *   selectedIndex: 1
 * };
 *
 * // Use default (first route selected)
 * const defaultOptions: ShowRoutesOptions = {};
 * ```
 *
 * @group Routing
 */
export type ShowRoutesOptions = {
    /**
     * The index of the route within the array of routes to show as selected.
     *
     * @remarks
     * Zero-based index corresponding to the position in the routes array.
     * The selected route is displayed with full color and prominence,
     * while other routes are dimmed to indicate they are alternatives.
     *
     * @default 0 (the first route is shown as selected)
     *
     * @example
     * ```typescript
     * selectedIndex: 0  // First route (usually fastest)
     * selectedIndex: 1  // Second route (usually alternative)
     * selectedIndex: 2  // Third route
     * ```
     */
    selectedIndex?: number;
};
