import type { TrafficAreaAnalytics } from '@tomtom-org/maps-sdk/core';
import type { FetchInput, ServiceTemplate } from '../shared';
import { fetchWith } from '../shared/fetch';
import { buildTrafficAreaAnalyticsRequest } from './requestBuilder';
import { parseTrafficAreaAnalyticsResponse } from './responseParser';
import { trafficAreaAnalyticsRequestSchema } from './trafficAreaAnalyticsRequestSchema';
import type { AreaAnalyticsRequestBody, AreaAnalyticsResponseAPI } from './types/apiTypes';
import type { TrafficAreaAnalyticsParams } from './types/trafficAreaAnalyticsParams';

/**
 * Traffic Area Analytics service template type.
 * @ignore
 */
export type TrafficAreaAnalyticsTemplate = ServiceTemplate<
    TrafficAreaAnalyticsParams,
    FetchInput<AreaAnalyticsRequestBody>,
    AreaAnalyticsResponseAPI,
    TrafficAreaAnalytics
>;

/**
 * Traffic Area Analytics service template main implementation.
 * @ignore
 */
export const trafficAreaAnalyticsTemplate: TrafficAreaAnalyticsTemplate = {
    requestValidation: { schema: trafficAreaAnalyticsRequestSchema },
    buildRequest: buildTrafficAreaAnalyticsRequest,
    sendRequest: fetchWith,
    parseResponse: parseTrafficAreaAnalyticsResponse,
    // The Area Analytics API does not include 'tomtom-user-agent' in its
    // CORS Access-Control-Allow-Headers, causing preflight failures in browsers.
    omitUserAgentHeader: true,
};
