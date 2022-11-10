/**
 * @group Geometry Search
 * @category Types
 */
export type PolygonAPI = {
    type: "POLYGON";
    vertices: string[];
};

/**
 * @group Geometry Search
 * @category Types
 */
export type CircleAPI = {
    type: "CIRCLE";
    position: string;
    radius: number;
};

/**
 * @group Geometry Search
 * @category Types
 */
export type GeometryAPI = PolygonAPI | CircleAPI;

/**
 * @group Geometry Search
 * @category Types
 */
export type SearchByGeometryPayloadAPI = {
    geometryList: GeometryAPI[];
};
