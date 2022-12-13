import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

/**
 * type that extends FeatureCollection and adding `properties` property to it.
 */
export interface FeatureCollectionWithProperties<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
    FeatureCollectionProps = unknown
> extends FeatureCollection<G, P> {
    properties?: FeatureCollectionProps;
}
