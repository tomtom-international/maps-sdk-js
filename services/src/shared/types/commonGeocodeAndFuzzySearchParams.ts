import type { HasBBox } from '@cet/maps-sdk-js/core';

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
 * @category Types
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
     * Search radius in meters around the specified position.
     *
     * When used with `position`, constrains results to locations within
     * this distance from the position. Creates a circular search area.
     *
     * @remarks
     * **Behavior:**
     * - Must be used with `position` parameter
     * - Values ≤ 0 are ignored (parameter has no effect)
     * - Mutually exclusive with `boundingBox` (radius takes precedence)
     *
     * **Typical Values:**
     * - 500m: Immediate vicinity (walking distance)
     * - 2000m: Neighborhood area
     * - 5000m: City district
     * - 10000m: Greater city area
     *
     * @example
     * ```typescript
     * // Search within 1km radius
     * radiusMeters: 1000
     *
     * // Search within 5km radius
     * radiusMeters: 5000
     *
     * // Combined with position
     * position: [4.9, 52.3],
     * radiusMeters: 2000  // Within 2km of Amsterdam center
     * ```
     */
    radiusMeters?: number;

    /**
     * Bounding box to constrain search results to a rectangular area.
     *
     * Filters results to only include locations within the specified bounding box.
     * Accepts various GeoJSON formats that contain or can derive a bounding box.
     *
     * @remarks
     * **Accepted Formats:**
     * - Direct BBox array: `[minLng, minLat, maxLng, maxLat]`
     * - GeoJSON Feature/FeatureCollection with bbox property
     * - Any GeoJSON geometry (bbox calculated automatically)
     *
     * **Important:**
     * - Mutually exclusive with Point-Radius parameters
     * - Point-Radius (`position` + `radiusMeters`) takes precedence if both provided
     * - Useful for map viewport filtering
     *
     * **Use Cases:**
     * - "Search in visible map area"
     * - City/region boundary filtering
     * - Custom geographic restrictions
     *
     * @example
     * ```typescript
     * // Direct bounding box (Amsterdam area)
     * boundingBox: [4.8, 52.3, 5.0, 52.4]
     *
     * // From GeoJSON Feature
     * boundingBox: {
     *   type: 'Feature',
     *   bbox: [4.8, 52.3, 5.0, 52.4],
     *   geometry: { ... },
     *   properties: {}
     * }
     *
     * // From Polygon (bbox calculated)
     * boundingBox: {
     *   type: 'Polygon',
     *   coordinates: [[
     *     [4.8, 52.3],
     *     [5.0, 52.3],
     *     [5.0, 52.4],
     *     [4.8, 52.4],
     *     [4.8, 52.3]
     *   ]]
     * }
     * ```
     */
    boundingBox?: HasBBox;

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
