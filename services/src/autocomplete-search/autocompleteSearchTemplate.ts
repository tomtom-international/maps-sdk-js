import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { autocompleteSearchRequestSchema } from './autocompleteSearchRequestSchema';
import { buildAutocompleteSearchRequest } from './requestBuilder';
import { parseAutocompleteSearchResponse } from './responseParser';
import type { AutocompleteSearchParams, AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from './types';

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
