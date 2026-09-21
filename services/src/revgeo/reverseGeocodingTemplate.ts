import type { GetObject, ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { buildRevGeoRequest } from './requestBuilder';
import { parseRevGeoResponse } from './responseParser';
import type { ReverseGeocodingResponse } from './reverseGeocoding';
import { revGeocodeRequestSchema } from './revGeocodeRequestSchema';
import type { ReverseGeocodingResponseAPI } from './types/apiTypes';
import type { ReverseGeocodingParams } from './types/reverseGeocodingParams';

/**
 * Reverse Geocoding service template type.
 * @ignore
 */
export type ReverseGeocodingTemplate = ServiceTemplate<
    ReverseGeocodingParams,
    GetObject,
    ReverseGeocodingResponseAPI,
    ReverseGeocodingResponse
>;

/**
 * Reverse Geocoding service template main implementation.
 * @ignore
 */
export const reverseGeocodingTemplate: ReverseGeocodingTemplate = {
    requestValidation: { schema: revGeocodeRequestSchema },
    buildRequest: buildRevGeoRequest,
    getAPIVersion: () => 2,
    sendRequest: get,
    parseResponse: parseRevGeoResponse,
};
