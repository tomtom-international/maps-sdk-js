import type { PolygonFeature } from '@tomtom-org/maps-sdk/core';
import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { reachableRangeRequestValidationConfig } from './reachableRangeRequestSchema';
import { buildReachableRangeRequest } from './requestBuilder';
import { parseReachableRangeResponse } from './responseParser';
import type { ReachableRangeResponseAPI } from './types/apiResponseTypes';
import type { ReachableRangeParams } from './types/reachableRangeParams';

export type ReachableRangeTemplate = ServiceTemplate<
    ReachableRangeParams,
    URL,
    ReachableRangeResponseAPI,
    PolygonFeature<ReachableRangeParams>
>;

export const reachableRangeTemplate: ReachableRangeTemplate = {
    requestValidation: reachableRangeRequestValidationConfig,
    buildRequest: buildReachableRangeRequest,
    sendRequest: get,
    parseResponse: parseReachableRangeResponse,
};
