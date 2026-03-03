import type { GeoJSON } from 'geojson';

/**
 * @ignore
 */
export type AdditionalDataAPI = {
    providerID: string;
    error?: string;
    geometryData: GeoJSON;
};

/**
 * @ignore
 */
export type GeometryDataResponseAPI = {
    additionalData: AdditionalDataAPI[];
};
