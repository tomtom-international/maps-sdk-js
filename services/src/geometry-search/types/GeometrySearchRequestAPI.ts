export type PolygonAPI = {
    type: "POLYGON";
    vertices: string[];
};

export type CircleAPI = {
    type: "CIRCLE";
    position: string;
    radius: number;
};

export type GeometryAPI = PolygonAPI | CircleAPI;

export type SearchByGeometryPayloadAPI = {
    geometryList: GeometryAPI[];
};
