import { GeoJsonObject } from "geojson";

/**
 * @ignore
 * @group Geometry Data
 * @category Types
 */
export type AdditionalDataAPI = {
    providerID: string;
    error: string;
    geometryData: GeoJsonObject;
};

/**
 * @ignore
 * @group Geometry Data
 * @category Types
 */
export type GeometryDataResponseAPI = {
    additionalData: AdditionalDataAPI[];
};
