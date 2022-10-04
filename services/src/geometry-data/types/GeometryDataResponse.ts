import { FeatureCollection, MultiPolygon, Polygon } from "geojson";

export type GeometryDataResponse = FeatureCollection<Polygon | MultiPolygon>;
