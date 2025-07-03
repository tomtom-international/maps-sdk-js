import type { PolygonFeatures } from '@anw/maps-sdk-js/core';
import type { MultiPolygon, Polygon, Position } from 'geojson';
import type { CommonSearchParams } from '../../shared';
import type { GeometrySearchRequestAPI } from './geometrySearchRequestAPI';
import type { GeometrySearchResponseAPI } from './geometrySearchResponseAPI';

export type GeometrySearchParams = CommonSearchParams<GeometrySearchRequestAPI, GeometrySearchResponseAPI> & {
    /**
     * List of geometries to search.
     * * (Also referred to as "geometryList")
     */
    geometries: SearchGeometryInput[];
};

// geo-json does not support circle as a Geometry shape
export interface Circle {
    type: 'Circle';
    coordinates: Position;
    radius: number;
}

export type SearchGeometryInput = Polygon | MultiPolygon | Circle | PolygonFeatures;
