import { GeocodingResponse } from "./types/geocodingResponse";
import { parseGeocodingResponse } from "./responseParser";
import { buildGeocodingRequest } from "./requestBuilder";
import { get } from "../shared/fetch";
import { ServiceTemplate } from "../shared";
import { GeocodingParams } from "./types/geocodingParams";
import { GeocodingResponseAPI } from "./types/apiTypes";
import { geocodingRequestSchema } from "./geocodingRequestSchema";

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
