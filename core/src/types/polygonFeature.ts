import type {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonObject,
    GeoJsonProperties,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from 'geojson';

/**
 * Input type representing a geographic point location.
 *
 * Accepts various formats for specifying a point location:
 * - `Position`: Raw coordinate array `[longitude, latitude]`
 * - `Point`: GeoJSON Point geometry
 * - `Feature<Point>`: GeoJSON Feature containing a Point geometry
 *
 * @remarks
 * Note: Coordinates follow GeoJSON standard with longitude first, then latitude: `[lng, lat]`
 *
 * @example
 * ```typescript
 * // As Position array
 * const pos1: HasLngLat = [4.9041, 52.3676];
 *
 * // As Point geometry
 * const pos2: HasLngLat = { type: 'Point', coordinates: [4.9041, 52.3676] };
 *
 * // As Feature
 * const pos3: HasLngLat = {
 *   type: 'Feature',
 *   geometry: { type: 'Point', coordinates: [4.9041, 52.3676] },
 *   properties: {}
 * };
 * ```
 *
 * @group Shared
 * @category Types
 */
export type HasLngLat = Position | Point | Feature<Point>;

/**
 * Input type representing a geographic bounding box or an object from which a bounding box can be derived.
 *
 * Accepts various formats:
 * - `BBox`: Direct GeoJSON bounding box array `[west, south, east, north]`
 * - `GeoJsonObject`: Any GeoJSON object with a `bbox` property or from which bounds can be calculated
 * - `GeoJsonObject[]`: Array of GeoJSON objects (convenience extension to standard GeoJSON)
 *
 * @remarks
 * Bounding boxes follow the format: `[minLon, minLat, maxLon, maxLat]` or `[west, south, east, north]`
 *
 * @example
 * ```typescript
 * // Direct BBox array
 * const bbox1: HasBBox = [4.8, 52.3, 5.0, 52.4];
 *
 * // Feature with bbox property
 * const bbox2: HasBBox = {
 *   type: 'Feature',
 *   bbox: [4.8, 52.3, 5.0, 52.4],
 *   geometry: { type: 'Polygon', coordinates: [...] },
 *   properties: {}
 * };
 *
 * // Array of features to derive bounds from
 * const bbox3: HasBBox = [feature1, feature2, feature3];
 * ```
 *
 * @group Shared
 * @category Types
 */
export type HasBBox = BBox | GeoJsonObject | GeoJsonObject[];

/**
 * Optional bounding box value.
 *
 * @group Shared
 * @category Types
 */
export type OptionalBBox = BBox | undefined;

/**
 * GeoJSON Feature containing polygon or multi-polygon geometry.
 *
 * Represents an area on the map, such as:
 * - Administrative boundaries (countries, states, cities)
 * - Points of interest with building footprints
 * - Search areas or geofences
 * - Route reachable ranges
 *
 * @typeParam P - Type of the feature's properties object
 *
 * @example
 * ```typescript
 * const cityBoundary: PolygonFeature<{ name: string, population: number }> = {
 *   type: 'Feature',
 *   geometry: {
 *     type: 'Polygon',
 *     coordinates: [[
 *       [4.8, 52.3],
 *       [5.0, 52.3],
 *       [5.0, 52.4],
 *       [4.8, 52.4],
 *       [4.8, 52.3]
 *     ]]
 *   },
 *   properties: {
 *     name: 'Amsterdam',
 *     population: 872680
 *   }
 * };
 * ```
 *
 * @group Shared
 * @category Types
 */
export type PolygonFeature<P = GeoJsonProperties> = Feature<Polygon | MultiPolygon, P>;

/**
 * GeoJSON FeatureCollection containing polygon or multi-polygon features.
 *
 * Represents multiple polygonal areas, useful for:
 * - Collections of administrative boundaries
 * - Multiple search result areas
 * - Multiple building footprints
 *
 * @typeParam P - Type of each feature's properties object
 *
 * @example
 * ```typescript
 * const neighborhoods: PolygonFeatures<{ name: string, area: number }> = {
 *   type: 'FeatureCollection',
 *   features: [
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Polygon', coordinates: [...] },
 *       properties: { name: 'District 1', area: 500000 }
 *     },
 *     {
 *       type: 'Feature',
 *       geometry: { type: 'Polygon', coordinates: [...] },
 *       properties: { name: 'District 2', area: 750000 }
 *     }
 *   ]
 * };
 * ```
 *
 * @group Shared
 * @category Types
 */
export type PolygonFeatures<P = GeoJsonProperties> = FeatureCollection<Polygon | MultiPolygon, P>;
