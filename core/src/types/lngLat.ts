/**
 * Specifies how to handle entry points when extracting a position from a place.
 *
 * Entry points represent specific access locations for a place (e.g., building entrances, parking lot entries).
 *
 * @remarks
 * - `main-when-available`: Returns the main entry point position if available, otherwise falls back to the default place position.
 *   This is useful for routing to ensure vehicles are directed to the correct entrance.
 * - `ignore`: Always returns the default position of the place (typically the center point).
 *
 * @example
 * ```typescript
 * // Get position preferring entry point for routing
 * const position = getPosition(place, { useEntryPoint: 'main-when-available' });
 *
 * // Get center position ignoring entry points
 * const centerPos = getPosition(place, { useEntryPoint: 'ignore' });
 * ```
 *
 * @group Shared
 * @category Types
 */
export type GetPositionEntryPointOption = 'main-when-available' | 'ignore';

/**
 * Configuration options for extracting position coordinates from a place.
 *
 * @group Shared
 * @category Types
 */
export type GetPositionOptions = {
    /**
     * Controls whether to use entry point positions when available.
     *
     * When set to `'main-when-available'`, the main entry point coordinates will be returned
     * if they exist, otherwise the default place position is used. This is particularly useful
     * for routing applications where you want to direct users to the correct entrance.
     *
     * @default 'ignore'
     *
     * @example
     * ```typescript
     * // For routing to a specific entrance
     * { useEntryPoint: 'main-when-available' }
     *
     * // For displaying place center on map
     * { useEntryPoint: 'ignore' }
     * ```
     */
    useEntryPoint?: GetPositionEntryPointOption;
};
