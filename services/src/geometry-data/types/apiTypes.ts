import type { GeoJsonObject } from 'geojson';

/**
 * @ignore
 */
export type AdditionalDataAPI = {
    providerID: string;
    error: string;
    geometryData: GeoJsonObject;
};

/**
 * @ignore
 */
export type GeometryDataResponseAPI = {
    additionalData: AdditionalDataAPI[];
};
