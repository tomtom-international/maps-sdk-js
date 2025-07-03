import type { ServiceTemplate } from '../shared';
import { post } from '../shared/fetch';
import { geometrySearchRequestSchema } from './geometrySearchRequestSchema';
import { buildGeometrySearchRequest } from './requestBuilder';
import { parseGeometrySearchResponse } from './responseParser';
import type {
    GeometrySearchParams,
    GeometrySearchRequestAPI,
    GeometrySearchResponse,
    GeometrySearchResponseAPI,
} from './types';

/**
 * Geometry search service template type.
 */
export type GeometrySearchTemplate = ServiceTemplate<
    GeometrySearchParams,
    GeometrySearchRequestAPI,
    GeometrySearchResponseAPI,
    GeometrySearchResponse
>;

/**
 * Geometry search service template main implementation.
 */
export const geometrySearchTemplate: GeometrySearchTemplate = {
    requestValidation: { schema: geometrySearchRequestSchema },
    buildRequest: buildGeometrySearchRequest,
    sendRequest: post,
    parseResponse: parseGeometrySearchResponse,
};
