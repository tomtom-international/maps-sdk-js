/**
 * List of available views for geopolitical context.
 * @group Shared
 * @category Types
 */
export const views = ['Unified', 'AR', 'IN', 'PK', 'IL', 'MA', 'RU', 'TR', 'CN'] as const;

/**
 * Geopolitical view context for map display and data.
 *
 * Controls how disputed territories and borders are displayed on the map and in service responses.
 * Different countries may have different perspectives on territorial boundaries and place names.
 *
 * @remarks
 * - `Unified`: Default view with a neutral representation
 * - Country-specific codes (e.g., `AR`, `IN`, `PK`, etc.): Displays boundaries and names according to that country's perspective
 *
 * @example
 * ```typescript
 * // Use unified/neutral view
 * const view: View = 'Unified';
 *
 * // Use India's geopolitical perspective
 * const view: View = 'IN';
 *
 * // Use Argentina's perspective
 * const view: View = 'AR';
 * ```
 *
 * @group Shared
 * @category Types
 */
export type View = (typeof views)[number];
