import { parseAutocompleteResponse } from "./ResponseParser";
import { buildAutocompleteRequest } from "./RequestBuilder";
import { get } from "../shared/Fetch";
import { ServiceTemplate } from "../shared";
import { AutocompleteParams, AutocompleteResponse, AutocompleteResponseAPI } from "./types";
import { autocompleteRequestSchema } from "./AutocompleteRequestSchema";

/**
 * Autocomplete service template type.
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteTemplate = ServiceTemplate<
    AutocompleteParams,
    URL,
    AutocompleteResponseAPI,
    AutocompleteResponse
>;

/**
 * Autocomplete service template main implementation.
 * @group Autocomplete
 * @category Variables
 */
export const autocompleteTemplate: AutocompleteTemplate = {
    validateRequestSchema: autocompleteRequestSchema,
    buildRequest: buildAutocompleteRequest,
    sendRequest: get,
    parseResponse: parseAutocompleteResponse
};
