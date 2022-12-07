import { GeometrySearchParams, GeometrySearchResponse } from "../geometry-search";
import { geometrySearch } from "../geometry-search/GeometrySearch";
import { GeometrySearchTemplate } from "../geometry-search/GeometrySearchTemplate";
import { FuzzySearchParams, FuzzySearchResponse } from "../fuzzy-search";
import { fuzzySearch } from "../fuzzy-search/FuzzySearch";
import { FuzzySearchTemplate } from "../fuzzy-search/FuzzySearchTemplate";

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/search-service
 * @group Search
 * @category Functions
 */
export const search = async (
    params: GeometrySearchParams | FuzzySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate | FuzzySearchTemplate>
): Promise<GeometrySearchResponse | FuzzySearchResponse> => {
    if ("geometries" in params) {
        return geometrySearch(params, customTemplate as GeometrySearchTemplate);
    } else {
        return fuzzySearch(params, customTemplate as FuzzySearchTemplate);
    }
};

export default search;
