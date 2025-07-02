import { parseAutocompleteSearchResponse } from './responseParser';
import { buildAutocompleteSearchRequest } from './requestBuilder';
import { get } from '../shared/fetch';
import type { ServiceTemplate } from '../shared';
import type { AutocompleteSearchParams, AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from './types';
import { autocompleteSearchRequestSchema } from './autocompleteSearchRequestSchema';

/**
 * Autocomplete service template type.
 */
export type AutocompleteSearchTemplate = ServiceTemplate<
    AutocompleteSearchParams,
    URL,
    AutocompleteSearchResponseAPI,
    AutocompleteSearchResponse
>;

/**
 * Autocomplete service template main implementation.
 */
export const autocompleteSearchTemplate: AutocompleteSearchTemplate = {
    requestValidation: { schema: autocompleteSearchRequestSchema },
    buildRequest: buildAutocompleteSearchRequest,
    sendRequest: get,
    parseResponse: parseAutocompleteSearchResponse,
};
