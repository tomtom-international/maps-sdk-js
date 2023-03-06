import { parseAutocompleteSearchResponse } from "./ResponseParser";
import { buildAutocompleteSearchRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
import { AutocompleteSearchParams, AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from "./types";
import { autocompleteSearchRequestSchema } from "./AutocompleteSearchRequestSchema";

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
