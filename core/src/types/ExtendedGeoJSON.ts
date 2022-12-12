import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export interface FeatureCollectionWithProperties<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
    FeatureCollectionProps = unknown
> extends FeatureCollection<G, P> {
    properties?: FeatureCollectionProps;
}
