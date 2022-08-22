import { GeocodingResponse } from "./types/GeocodingResponse";
import { parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeocodingParams } from "./types/GeocodingParams";
import { GeocodingResponseAPI } from "./types/APITypes";

/**
 * Geocoding service template type.
 */
export type GeocodingTemplate = ServiceTemplate<
    GeocodingParams,
    URL,
    GeocodingResponseAPI,
    GeocodingResponse | unknown
>;

/**
 * Geocoding service template main implementation.
 */
export const geocodingTemplate: GeocodingTemplate = {
    buildRequest: buildGeocodingRequest,
    sendRequest: getJson,
    parseResponse: parseGeocodingResponse
};
