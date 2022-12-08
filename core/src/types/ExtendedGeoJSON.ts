import { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export interface FeatureCollectionWithProperties<G extends Geometry | null = Geometry, P = GeoJsonProperties>
    extends FeatureCollection<G, P> {
    properties?: { [name: string]: unknown } | null;
}
