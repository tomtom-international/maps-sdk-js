import { AutocompleteParams, AutocompleteResponse } from "./types";
import { autocompleteTemplate, AutocompleteTemplate } from "./AutocompleteTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 * The Autocomplete API enables you to make a more meaningful Search API call by recognizing entities inside an input query and offering them as query terms.
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/autocomplete-service/autocomplete
 * @group Autocomplete
 * @category Functions
 */
export const autocomplete = async (
    params: AutocompleteParams,
    customTemplate?: Partial<AutocompleteTemplate>
): Promise<AutocompleteResponse> => {
    return callService(params, { ...autocompleteTemplate, ...customTemplate }, "Autocomplete");
};

export default autocomplete;
