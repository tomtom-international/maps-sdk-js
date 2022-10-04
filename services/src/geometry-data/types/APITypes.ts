import { GeoJsonObject } from "geojson";

export type AdditionalDataAPI = {
    providerID: string;
    error: string;
    geometryData: GeoJsonObject;
};

export type GeometryDataResponseAPI = {
    additionalData: AdditionalDataAPI[];
};
