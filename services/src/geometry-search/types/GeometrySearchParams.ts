import { GeometryDataResponse } from "@anw/maps-sdk-js/core";
import { MultiPolygon, Polygon, Position } from "geojson";
import { CommonSearchParams } from "../../shared";

export type GeometrySearchParams = CommonSearchParams & {
    /**
     * List of geometries to search.
     * * (Also referred to as "geometryList")
     */
    geometries: SearchGeometryInput[];
};

// geo-json does not support circle as a Geometry shape
export interface Circle {
    type: "Circle";
    coordinates: Position;
    radius: number;
}

export type SearchGeometryInput = Polygon | MultiPolygon | Circle | GeometryDataResponse;
