import { GeocodingResponse } from "./types/GeocodingResponse";
import { parseGeocodingResponse } from "./ResponseParser";
import { buildGeocodingRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
import { GeocodingParams } from "./types/GeocodingParams";
import { GeocodingResponseAPI } from "./types/APITypes";
import { geocodingRequestSchema } from "./GeocodingRequestSchema";

/**
 * Geocoding service template type.
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponseAPI, GeocodingResponse>;

/**
 * Geocoding service template main implementation.
 */
export const geocodingTemplate: GeocodingTemplate = {
    requestValidation: { schema: geocodingRequestSchema },
    buildRequest: buildGeocodingRequest,
    sendRequest: get,
    parseResponse: parseGeocodingResponse
};
