import { GeocodingResponse } from "./types/GeocodingResponse";
import { parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { ServiceTemplate } from "../shared/ServiceTypes";
import { GeocodingParams } from "./types/GeocodingParams";
import { GeocodingResponseAPI } from "./types/APITypes";

/**
 * Geocoding service template type.
 * @group Geocoding
 * @category Types
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponseAPI, GeocodingResponse>;

/**
 * Geocoding service template main implementation.
 * @group Geocoding
 * @category Variables
 */
export const geocodingTemplate: GeocodingTemplate = {
    buildRequest: buildGeocodingRequest,
    sendRequest: getJson,
    parseResponse: parseGeocodingResponse
};
