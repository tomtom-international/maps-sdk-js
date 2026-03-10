import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { poiCategoriesRequestSchema } from './poiCategoriesRequestSchema';
import { buildPoiCategoriesRequest } from './requestBuilder';
import { parsePoiCategoriesResponse } from './responseParser';
import type { POICategoriesParams, POICategoriesResponse, PoiCategoriesResponseAPI } from './types';

/**
 * @ignore
 */
export type PoiCategoriesTemplate = ServiceTemplate<
    POICategoriesParams,
    URL,
    PoiCategoriesResponseAPI,
    POICategoriesResponse
>;

/**
 * @ignore
 */
export const poiCategoriesTemplate: PoiCategoriesTemplate = {
    requestValidation: { schema: poiCategoriesRequestSchema },
    buildRequest: buildPoiCategoriesRequest,
    getAPIVersion: () => 1,
    sendRequest: get,
    parseResponse: parsePoiCategoriesResponse,
};
