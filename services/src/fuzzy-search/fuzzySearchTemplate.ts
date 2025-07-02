import { parseFuzzySearchResponse } from './responseParser';
import { buildFuzzySearchRequest } from './requestBuilder';
import { get } from '../shared/fetch';
import type { ServiceTemplate } from '../shared';
import type { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from './types';
import { fuzzySearchRequestSchema } from './fuzzySearchRequestSchema';

/**
 * Fuzzy search service template type.
 */
export type FuzzySearchTemplate = ServiceTemplate<FuzzySearchParams, URL, FuzzySearchResponseAPI, FuzzySearchResponse>;

/**
 * Fuzzy search service template main implementation.
 */
export const fuzzySearchTemplate: FuzzySearchTemplate = {
    requestValidation: { schema: fuzzySearchRequestSchema },
    buildRequest: buildFuzzySearchRequest,
    sendRequest: get,
    parseResponse: parseFuzzySearchResponse,
};
