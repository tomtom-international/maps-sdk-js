import type { PolygonFeatures } from '@cet/maps-sdk-js/core';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import type { CommonSearchParams } from '../../shared';
import type { GeometrySearchRequestAPI } from './geometrySearchRequestAPI';
import type { GeometrySearchResponseAPI } from './geometrySearchResponseAPI';

/**
 * Parameters for searching places within specific geographic areas (geometry search).
 *
 * Geometry search finds places that fall within or near the boundaries of one or more
 * geometric shapes (polygons, circles, or multipolygons). This enables area-based searches
 * like "restaurants in this neighborhood" or "hotels within these city boundaries".
 *
 * @remarks
 * **Key Features:**
 * - Search within multiple geometries simultaneously
 * - Supports polygons, multipolygons, and circles
 * - Can use geometries from previous search results
 * - Combines with text queries for filtered results
 *
 * **Use Cases:**
 * - Find POIs within administrative boundaries
 * - Search within custom drawn areas on map
 * - Filter results to specific neighborhoods or regions
 * - Proximity searches using circles
 *
 * @example
 * ```typescript
 * // Search within a circular area
 * const results = await search({
 *   key: 'your-api-key',
 *   query: 'restaurant',
 *   geometries: [{
 *     type: 'Circle',
 *     coordinates: [4.9041, 52.3676],
 *     radius: 1000  // meters
 *   }]
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Search within a polygon
 * const results = await search({
 *   key: 'your-api-key',
 *   query: 'parking',
 *   geometries: [{
 *     type: 'Polygon',
 *     coordinates: [[
 *       [4.88, 52.36],
 *       [4.90, 52.36],
 *       [4.90, 52.38],
 *       [4.88, 52.38],
 *       [4.88, 52.36]
 *     ]]
 *   }]
 * });
 * ```
 *
 * @group Search
 */
export type GeometrySearchParams = CommonSearchParams<GeometrySearchRequestAPI, GeometrySearchResponseAPI> & {
    /**
     * List of geometries to search within.
     *
     * Can be a mix of polygons, multipolygons, circles, or geometry feature collections
     * from previous search results. Places that fall within or near these geometries
     * will be returned.
     *
     * @remarks
     * Also referred to as "geometryList" in API documentation.
     *
     * **Supported Types:**
     * - {@link Circle} - Circular search area with radius
     * - `Polygon` - Custom polygon boundary (GeoJSON)
     * - `MultiPolygon` - Multiple polygon areas (GeoJSON)
     * - `PolygonFeatures` - Feature collection with polygon geometries
     *
     * @example
     * ```typescript
     * // Multiple geometries
     * geometries: [
     *   { type: 'Circle', coordinates: [4.9, 52.3], radius: 500 },
     *   { type: 'Polygon', coordinates: [[...]] }
     * ]
     * ```
     */
    geometries: SearchGeometryInput[];
};

/**
 * Circular search geometry (non-standard GeoJSON extension).
 *
 * Defines a circular search area by center point and radius. This is a convenience
 * type since standard GeoJSON does not include circles.
 *
 * @remarks
 * **Note:** This is not part of the official GeoJSON specification. It's a Maps SDK
 * extension that gets converted to the appropriate API format internally.
 *
 * **Coordinate Format:** `[longitude, latitude]` (standard GeoJSON order)
 *
 * @example
 * ```typescript
 * const circle: Circle = {
 *   type: 'Circle',
 *   coordinates: [4.9041, 52.3676],  // Amsterdam center
 *   radius: 2000  // 2km radius
 * };
 * ```
 *
 * @group Search
 */
export interface Circle {
    /**
     * Geometry type identifier.
     * Must be the literal string `'Circle'`.
     */
    type: 'Circle';

    /**
     * Center point of the circle in `[longitude, latitude]` format.
     *
     * @example [4.9041, 52.3676]
     */
    coordinates: Position;

    /**
     * Radius of the circle in meters.
     *
     * @remarks
     * Defines the search area around the center point. Places within or near
     * this radius will be included in results.
     *
     * @example 1000 // 1 kilometer
     */
    radius: number;
}

/**
 * Union type of all supported geometry search input formats.
 *
 * Accepts standard GeoJSON polygons/multipolygons, custom circles, or polygon
 * feature collections (such as those returned from previous searches or the
 * geometry data service).
 *
 * @remarks
 * **Flexibility:**
 * - Mix different geometry types in a single search
 * - Use results from {@link geometryData} directly
 * - Pass search results with geometries as boundaries
 * - Define custom polygons for precise area searches
 *
 * @example
 * ```typescript
 * // Using different geometry types
 * const geometries: SearchGeometryInput[] = [
 *   // Circle
 *   { type: 'Circle', coordinates: [4.9, 52.3], radius: 1000 },
 *
 *   // Polygon
 *   {
 *     type: 'Polygon',
 *     coordinates: [[
 *       [4.88, 52.36], [4.90, 52.36], [4.90, 52.38], [4.88, 52.38], [4.88, 52.36]
 *     ]]
 *   },
 *
 *   // From previous geometry data call
 *   cityBoundaries  // PolygonFeatures
 * ];
 * ```
 *
 * @group Search
 */
export type SearchGeometryInput = Polygon | MultiPolygon | Circle | PolygonFeatures;
