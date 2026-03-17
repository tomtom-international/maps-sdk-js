import type { ServiceTemplate } from '../shared';
import { post } from '../shared/fetch';
import { alongRouteSearchRequestSchema } from './alongRouteSearchRequestSchema';
import { buildAlongRouteSearchRequest } from './requestBuilder';
import { parseAlongRouteSearchResponse } from './responseParser';
import type {
    AlongRouteSearchParams,
    AlongRouteSearchRequestAPI,
    AlongRouteSearchResponse,
    AlongRouteSearchResponseAPI,
} from './types';

/**
 * Along-route search service template type.
 * @ignore
 */
export type AlongRouteSearchTemplate = ServiceTemplate<
    AlongRouteSearchParams,
    AlongRouteSearchRequestAPI,
    AlongRouteSearchResponseAPI,
    AlongRouteSearchResponse
>;

/**
 * Along-route search service template main implementation.
 * @ignore
 */
export const alongRouteSearchTemplate: AlongRouteSearchTemplate = {
    requestValidation: { schema: alongRouteSearchRequestSchema },
    buildRequest: buildAlongRouteSearchRequest,
    sendRequest: post,
    parseResponse: parseAlongRouteSearchResponse,
};
