import type { PostObject } from '../../shared';

/**
 * @ignore
 */
export type PolygonAPI = {
    type: 'POLYGON';
    vertices: string[];
};

/**
 * @ignore
 */
export type CircleAPI = {
    type: 'CIRCLE';
    position: string;
    radius: number;
};

/**
 * @ignore
 */
export type GeometryAPI = PolygonAPI | CircleAPI;

/**
 * @ignore
 */
export type GeometrySearchPayloadAPI = {
    geometryList: GeometryAPI[];
};

/**
 * Geometry search request type.
 * @ignore
 */
export type GeometrySearchRequestAPI = PostObject<GeometrySearchPayloadAPI>;
