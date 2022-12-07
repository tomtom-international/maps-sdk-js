import { FuzzySearchParams, FuzzySearchResponse } from "./types";
import { fuzzySearchTemplate, FuzzySearchTemplate } from "./FuzzySearchTemplate";
import { callService } from "../shared/ServiceTemplate";

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/fuzzy-search
 * @group Fuzzy Search
 * @category Functions
 */
export const fuzzySearch = async (
    params: FuzzySearchParams,
    customTemplate?: Partial<FuzzySearchTemplate>
): Promise<FuzzySearchResponse> => {
    return callService(params, { ...fuzzySearchTemplate, ...customTemplate }, "FuzzySearch");
};

export default fuzzySearch;
