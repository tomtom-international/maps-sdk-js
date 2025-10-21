import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

/**
 * Extended GeoJSON FeatureCollection with additional properties at the collection level.
 *
 * This type extends the standard GeoJSON FeatureCollection by adding an optional `properties` field
 * at the collection level (in addition to properties on individual features).
 *
 * @typeParam G - The geometry type for features in the collection (defaults to Geometry)
 * @typeParam P - The type of properties for individual features (defaults to GeoJsonProperties)
 * @typeParam FeatureCollectionProps - The type of properties for the collection itself (defaults to unknown)
 *
 * @example
 * ```typescript
 * // Collection of routes with summary properties at the collection level
 * const routeCollection: FeatureCollectionWithProperties<LineString, RouteProps, { totalDistance: number }> = {
 *   type: 'FeatureCollection',
 *   features: [...],
 *   properties: { totalDistance: 1000 }
 * };
 * ```
 *
 * @group Shared
 */
export interface FeatureCollectionWithProperties<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
    FeatureCollectionProps = unknown,
> extends FeatureCollection<G, P> {
    /**
     * Optional properties for the entire feature collection.
     * This allows metadata to be attached at the collection level.
     */
    properties?: FeatureCollectionProps;
}
