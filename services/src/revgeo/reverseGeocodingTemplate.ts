import { ServiceTemplate } from "../shared";
import { ReverseGeocodingParams } from "./types/reverseGeocodingParams";
import { ReverseGeocodingResponse } from "./reverseGeocoding";
import { buildRevGeoRequest } from "./requestBuilder";
import { get } from "../shared/fetch";
import { parseRevGeoResponse } from "./responseParser";
import { ReverseGeocodingResponseAPI } from "./types/apiTypes";
import { revGeocodeRequestSchema } from "./revGeocodeRequestSchema";

/**
 * Reverse Geocoding service template type.
 */
export type ReverseGeocodingTemplate = ServiceTemplate<
    ReverseGeocodingParams,
    URL,
    ReverseGeocodingResponseAPI,
    ReverseGeocodingResponse
>;

/**
 * Reverse Geocoding service template main implementation.
 */
export const reverseGeocodingTemplate: ReverseGeocodingTemplate = {
    requestValidation: { schema: revGeocodeRequestSchema },
    buildRequest: buildRevGeoRequest,
    sendRequest: get,
    parseResponse: parseRevGeoResponse
};
