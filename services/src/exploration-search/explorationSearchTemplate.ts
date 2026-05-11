import type { ServiceTemplate } from '../shared';
import { post } from '../shared/fetch';
import { explorationSearchRequestValidationConfig } from './explorationSearchRequestSchema';
import { buildExplorationSearchRequest } from './requestBuilder';
import { parseExplorationSearchResponse } from './responseParser';
import type {
    ExplorationSearchParams,
    ExplorationSearchRequestAPI,
    ExplorationSearchResponse,
    ExplorationSearchResponseAPI,
} from './types';

/**
 * Exploration search service template type.
 * @ignore
 */
export type ExplorationSearchTemplate = ServiceTemplate<
    ExplorationSearchParams,
    ExplorationSearchRequestAPI,
    ExplorationSearchResponseAPI,
    ExplorationSearchResponse
>;

/**
 * Exploration search service template main implementation.
 * @ignore
 */
export const explorationSearchTemplate: ExplorationSearchTemplate = {
    requestValidation: explorationSearchRequestValidationConfig,
    buildRequest: buildExplorationSearchRequest,
    sendRequest: post,
    parseResponse: parseExplorationSearchResponse,
};
