import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { buildRevGeoRequest } from './requestBuilder';
import { parseRevGeoResponse } from './responseParser';
import type { ReverseGeocodingResponse } from './reverseGeocoding';
import { revGeocodeRequestSchema } from './revGeocodeRequestSchema';
import type { ReverseGeocodingResponseAPI } from './types/apiTypes';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

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
