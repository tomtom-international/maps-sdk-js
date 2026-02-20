import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import { parseRoutingResponseError } from '../routing/routingResponseErrorParser';
import type { ServiceTemplate } from '../shared';
import { fetchWith } from '../shared/fetch';
import { reachableRangeRequestValidationConfig } from './reachableRangeRequestSchema';
import { buildReachableRangeRequest } from './requestBuilder';
import { parseReachableRangeResponse } from './responseParser';
import type { ReachableRangeRequestAPI } from './types/apiRequestTypes';
import type { ReachableRangeResponseAPI } from './types/apiResponseTypes';
import type { ReachableRangeParams } from './types/reachableRangeParams';

export type ReachableRangeTemplate = ServiceTemplate<
    ReachableRangeParams,
    ReachableRangeRequestAPI,
    ReachableRangeResponseAPI,
    PolygonFeature<ReachableRangeParams>
>;

export const reachableRangeTemplate: ReachableRangeTemplate = {
    requestValidation: reachableRangeRequestValidationConfig,
    buildRequest: buildReachableRangeRequest,
    sendRequest: fetchWith,
    parseResponse: parseReachableRangeResponse,
    parseResponseError: parseRoutingResponseError,
    getAPIVersion: () => 3,
};
