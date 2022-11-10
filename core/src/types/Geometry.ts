import { BBox, Feature, FeatureCollection, GeoJsonObject, MultiPolygon, Point, Polygon, Position } from "geojson";

/**
 * An GeoJSON input type that consists of, or has, a [lng, lat] Position.
 * @group Shared
 * @category Types
 */
export type HasLngLat = Position | Point | Feature<Point>;

/**
 * An GeoJSON input type that consists of, has, or can infer, a bounding box.
 * * BBox: directly a GeoJSON simple BBox
 * * Any GeoJSON object containing the "bbox" field.
 * * Any GeoJSON object from which a bbox can be calculated
 * (feature or geometry with (Multi)LineString or (Multi)Polygon)).
 * @group Shared
 * @category Types
 */
export type HasBBox = BBox | GeoJsonObject;
/**
 * @group Shared
 * @category Types
 */
export type OptionalBBox = BBox | undefined;

/**
 * Polygon geometry data (from geometry data service).
 * @group Shared
 * @category Types
 */
export type GeometryDataResponse = FeatureCollection<Polygon | MultiPolygon>;
