import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeocodingParams } from "./GeocodingParams";
import { GeocodingResponse, parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { fetchJson } from "../shared/Fetch";

/**
 * Geocoding service template type.
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponse>;

/**
 * Geocoding service template main implementation.
 */
export const geocodingTemplate: GeocodingTemplate = {
    buildRequest: buildGeocodingRequest,
    sendRequest: fetchJson,
    parseResponse: parseGeocodingResponse
};
