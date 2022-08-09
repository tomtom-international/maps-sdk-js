import { GeocodingTemplate } from "./types";
import { parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { fetchJson } from "../..";

/**
 * Geocoding service template main implementation.
 */
export const geocodingTemplate: GeocodingTemplate = {
    buildRequest: buildGeocodingRequest,
    sendRequest: fetchJson,
    parseResponse: parseGeocodingResponse
};
