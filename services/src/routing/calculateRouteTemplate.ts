import type { Routes } from '@anw/maps-sdk-js/core';
import type { FetchInput, ServiceTemplate } from '../shared';
import { fetchWith } from '../shared/fetch';
import { routeRequestValidationConfig } from './calculateRouteRequestSchema';
import { buildCalculateRouteRequest } from './requestBuilder';
import { parseCalculateRouteResponse } from './responseParser';
import { parseRoutingResponseError } from './routingResponseErrorParser';
import type { CalculateRoutePOSTDataAPI } from './types/apiRequestTypes';
import type { CalculateRouteResponseAPI } from './types/apiResponseTypes';
import type { CalculateRouteParams } from './types/calculateRouteParams';

export type CalculateRouteTemplate = ServiceTemplate<
    CalculateRouteParams,
    FetchInput<CalculateRoutePOSTDataAPI>,
    CalculateRouteResponseAPI,
    Routes
>;

export const calculateRouteTemplate: CalculateRouteTemplate = {
    requestValidation: routeRequestValidationConfig,
    buildRequest: buildCalculateRouteRequest,
    sendRequest: fetchWith,
    parseResponse: parseCalculateRouteResponse,
    parseResponseError: parseRoutingResponseError,
    getAPIVersion: () => 2,
};
