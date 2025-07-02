import type { FetchInput, ServiceTemplate } from '../shared';
import { post } from '../shared/fetch';
import { matrixRouteValidationConfig } from './calculateMatrixRouteRequestSchema';
import { buildCalculateMatrixRouteRequest } from './requestBuilder';
import { parseCalculateMatrixRouteResponse } from './responseParser';
import type { CalculateMatrixRoutePOSTDataAPI } from './types/apiRequestTypes';
import type { CalculateMatrixRouteResponseAPI } from './types/apiResponseTypes';
import type { CalculateMatrixRouteParams } from './types/calculateMatrixRouteParams';

export type CalculateMatrixRouteTemplate = ServiceTemplate<
    CalculateMatrixRouteParams,
    FetchInput<CalculateMatrixRoutePOSTDataAPI>,
    CalculateMatrixRouteResponseAPI,
    CalculateMatrixRouteResponseAPI
>;

export const calculateMatrixRouteTemplate: CalculateMatrixRouteTemplate = {
    requestValidation: matrixRouteValidationConfig,
    buildRequest: buildCalculateMatrixRouteRequest,
    sendRequest: post,
    parseResponse: parseCalculateMatrixRouteResponse,
};
