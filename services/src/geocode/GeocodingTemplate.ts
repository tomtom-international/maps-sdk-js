import { GeocodingResponse } from "./types/GeocodingResponse";
import { parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { fetchJson } from "../shared/Fetch";
import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeocodingParams } from "./types/GeocodingParams";

/**
 * Geocoding service template type.
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponse | unknown>;

/**
 * Geocoding service template main implementation.
 */
export const geocodingTemplate: GeocodingTemplate = {
    buildRequest: buildGeocodingRequest,
    sendRequest: fetchJson,
    parseResponse: parseGeocodingResponse
};
