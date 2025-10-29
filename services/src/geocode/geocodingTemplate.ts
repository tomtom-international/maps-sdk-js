import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { geocodingRequestSchema } from './geocodingRequestSchema';
import { buildGeocodingRequest } from './requestBuilder';
import { parseGeocodingResponse } from './responseParser';
import type { GeocodingResponseAPI } from './types/apiTypes';
import type { GeocodingParams } from './types/geocodingParams';
import type { GeocodingResponse } from './types/geocodingResponse';

/**
 * Geocoding service template type.
 * @ignore
 */
export type GeocodingTemplate = ServiceTemplate<GeocodingParams, URL, GeocodingResponseAPI, GeocodingResponse>;

/**
 * Geocoding service template main implementation.
 * @ignore
 */
export const geocodingTemplate: GeocodingTemplate = {
    requestValidation: { schema: geocodingRequestSchema },
    buildRequest: buildGeocodingRequest,
    sendRequest: get,
    parseResponse: parseGeocodingResponse,
};
