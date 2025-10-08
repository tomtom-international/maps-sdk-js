import { callService } from '../shared/serviceTemplate';
import type { AutocompleteSearchTemplate } from './autocompleteSearchTemplate';
import { autocompleteSearchTemplate } from './autocompleteSearchTemplate';
import type { AutocompleteSearchParams, AutocompleteSearchResponse } from './types';

/**
 * The Autocomplete API enables you to make a more meaningful Search API call by recognizing entities inside an input query and offering them as query terms.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://docs.tomtom.com/search-api/documentation/autocomplete-service/autocomplete
 */
export const autocompleteSearch = async (
    params: AutocompleteSearchParams,
    customTemplate?: Partial<AutocompleteSearchTemplate>,
): Promise<AutocompleteSearchResponse> =>
    callService(params, { ...autocompleteSearchTemplate, ...customTemplate }, 'Autocomplete');

export default autocompleteSearch;
