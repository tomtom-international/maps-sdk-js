import { parseAutocompleteSearchResponse } from "./responseParser";
import { buildAutocompleteSearchRequest } from "./requestBuilder";
import { get } from "../shared/fetch";
import { ServiceTemplate } from "../shared";
import { AutocompleteSearchParams, AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from "./types";
import { autocompleteSearchRequestSchema } from "./autocompleteSearchRequestSchema";

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
    parseResponse: parseAutocompleteSearchResponse
};
