import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { MultiPolygon, Polygon, Position } from "geojson";
import { CommonSearchParams } from "../../shared";

/**
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchParams = CommonSearchParams & {
    /**
     * List of geometries to search.
     * * (Also referred to as "geometryList")
     */
    geometries: SearchGeometryInput[];
};

// geo-json does not support circle as a Geometry shape
/**
 * @group Geometry Search
 * @category Interface
 */
export interface Circle {
    type: "Circle";
    coordinates: Position;
    radius: number;
}

/**
 * @group Geometry Search
 * @category Types
 */
export type SearchGeometryInput = Polygon | MultiPolygon | Circle | GeometryDataResponse;
