import type { ServiceTemplate } from '../shared';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';
import type { ReverseGeocodingResponse } from './reverseGeocoding';
import { buildRevGeoRequest } from './requestBuilder';
import { get } from '../shared/fetch';
import { parseRevGeoResponse } from './responseParser';
import type { ReverseGeocodingResponseAPI } from './types/apiTypes';
import { revGeocodeRequestSchema } from './revGeocodeRequestSchema';

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
    parseResponse: parseRevGeoResponse,
};
