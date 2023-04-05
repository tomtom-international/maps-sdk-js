import { AutocompleteSearchParams, AutocompleteSearchResponse } from "./types";
import { autocompleteSearchTemplate, AutocompleteSearchTemplate } from "./AutocompleteSearchTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 * The Autocomplete API enables you to make a more meaningful Search API call by recognizing entities inside an input query and offering them as query terms.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/autocomplete-service/autocomplete
 */
export const autocompleteSearch = async (
    params: AutocompleteSearchParams,
    customTemplate?: Partial<AutocompleteSearchTemplate>
): Promise<AutocompleteSearchResponse> =>
    callService(params, { ...autocompleteSearchTemplate, ...customTemplate }, "Autocomplete");

export default autocompleteSearch;
