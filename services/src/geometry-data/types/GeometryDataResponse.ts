import { FeatureCollection, MultiPolygon, Polygon } from "geojson";

/**
 * @group Geometry Data
 * @category Types
 */
export type GeometryDataResponse = FeatureCollection<Polygon | MultiPolygon>;
