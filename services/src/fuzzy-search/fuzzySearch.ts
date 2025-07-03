import { callService } from '../shared/serviceTemplate';
import type { FuzzySearchTemplate } from './fuzzySearchTemplate';
import { fuzzySearchTemplate } from './fuzzySearchTemplate';
import type { FuzzySearchParams, FuzzySearchResponse } from './types';

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search
 */
export const fuzzySearch = async (
    params: FuzzySearchParams,
    customTemplate?: Partial<FuzzySearchTemplate>,
): Promise<FuzzySearchResponse> => callService(params, { ...fuzzySearchTemplate, ...customTemplate }, 'FuzzySearch');

export default fuzzySearch;
