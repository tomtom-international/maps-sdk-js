import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

/**
 * Type that extends FeatureCollection and adding `properties` property to it.
 * @group Shared
 * @category Types
 */
export interface FeatureCollectionWithProperties<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
    FeatureCollectionProps = unknown,
> extends FeatureCollection<G, P> {
    properties?: FeatureCollectionProps;
}
