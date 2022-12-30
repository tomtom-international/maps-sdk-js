import { ServiceTemplate } from "../shared";
import { ReverseGeocodingParams } from "./types/ReverseGeocodingParams";
import { ReverseGeocodingResponse } from "./ReverseGeocoding";
import { buildRevGeoRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { parseRevGeoResponse } from "./ResponseParser";
import { ReverseGeocodingResponseAPI } from "./types/APITypes";
import { revGeocodeRequestSchema } from "./RevGeocodeRequestSchema";

/**
 * Reverse Geocoding service template type.
 * @group Reverse Geocoding
 * @category Types
 */
export type ReverseGeocodingTemplate = ServiceTemplate<
    ReverseGeocodingParams,
    URL,
    ReverseGeocodingResponseAPI,
    ReverseGeocodingResponse
>;

/**
 * Reverse Geocoding service template main implementation.
 * @group Reverse Geocoding
 * @category Variables
 */
export const reverseGeocodingTemplate: ReverseGeocodingTemplate = {
    requestValidation: { schema: revGeocodeRequestSchema },
    buildRequest: buildRevGeoRequest,
    sendRequest: get,
    parseResponse: parseRevGeoResponse
};
