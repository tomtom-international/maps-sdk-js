import { BBox, Feature, FeatureCollection, GeoJsonObject, MultiPolygon, Point, Polygon, Position } from "geojson";
import { Anything } from "./generic";

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
 * * An array of GeoJSON objects (not purely GeoJSON but added for convenience)
 * (feature or geometry with (Multi)LineString or (Multi)Polygon)).
 * @group Shared
 * @category Types
 */
export type HasBBox = BBox | GeoJsonObject | GeoJsonObject[];

/**
 * @group Shared
 * @category Types
 */
export type OptionalBBox = BBox | undefined;

/**
 * Polygon geometry data.
 * @group Shared
 * @category Types
 */
export type PolygonFeature<P = Anything> = Feature<Polygon | MultiPolygon, P>;

/**
 * Polygon geometry data collection.
 * @group Shared
 * @category Types
 */
export type PolygonFeatures<P = Anything> = FeatureCollection<Polygon | MultiPolygon, P>;
