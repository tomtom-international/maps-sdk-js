import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { fuzzySearchRequestSchema } from './fuzzySearchRequestSchema';
import { buildFuzzySearchRequest } from './requestBuilder';
import { parseFuzzySearchResponse } from './responseParser';
import type { FuzzySearchParams, FuzzySearchResponse, FuzzySearchResponseAPI } from './types';

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
