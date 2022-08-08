import { ServiceTemplate } from "../shared/ServiceTypes";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";
import { buildRevGeoRequest } from "./RequestBuilder";
import { getJson } from "../shared/Fetch";
import { parseRevGeoResponse } from "./ResponseParser";

/**
 * Reverse Geocoding service template type.
 * @group Search
 * @category Reverse Geocoding
 */
export type ReverseGeocodingTemplate = ServiceTemplate<ReverseGeocodingParams, URL, any, ReverseGeocodingResponse>;

/**
 * Reverse Geocoding service template main implementation.
 * @group Search
 * @category Reverse Geocoding
 */
export const reverseGeocodingTemplate: ReverseGeocodingTemplate = {
    buildRequest: buildRevGeoRequest,
    sendRequest: getJson,
    parseResponse: parseRevGeoResponse
};
