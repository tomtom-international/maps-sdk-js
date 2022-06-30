import { ServiceTemplate } from "../shared/ServiceTypes";
import { ReverseGeocodingParams } from "./ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";
import { buildRevGeoRequest } from "./RequestBuilder";
import { fetchJson } from "../shared/Fetch";
import { parseRevGeoResponse } from "./ResponseParser";

/**
 * Reverse Geocoding service template type.
 */
export type ReverseGeocodingTemplate = ServiceTemplate<ReverseGeocodingParams, URL, ReverseGeocodingResponse>;

/**
 * Reverse Geocoding service template main implementation.
 */
export const reverseGeocodingTemplate: ReverseGeocodingTemplate = {
    buildRequest: buildRevGeoRequest,
    sendRequest: fetchJson,
    parseResponse: parseRevGeoResponse
};
