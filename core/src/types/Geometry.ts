import { BBox, Feature, GeoJsonObject, Point, Position } from "geojson";

/**
 * An GeoJSON input type that consists of, or has, a [lng, lat] Position.
 */
export type HasLngLat = Position | Point | Feature<Point>;

/**
 * An GeoJSON input type that consists of, has, or can infer, a bounding box.
 * * BBox: directly a GeoJSON simple BBox
 * * Any GeoJSON object containing the "bbox" field.
 * * Any GeoJSON object from which a bbox can be calculated
 * (feature or geometry with (Multi)LineString or (Multi)Polygon)).
 */
export type HasBBox = BBox | GeoJsonObject;

export type OptionalBBox = BBox | undefined;
