import { GeometrySearchParams } from "../geometry-search";
import { geometrySearch } from "../geometry-search/GeometrySearch";
import { GeometrySearchTemplate } from "../geometry-search/GeometrySearchTemplate";
import { FuzzySearchParams, QueryIntent } from "../fuzzy-search";
import { fuzzySearch } from "../fuzzy-search/FuzzySearch";
import { FuzzySearchTemplate } from "../fuzzy-search/FuzzySearchTemplate";
import { Places, SearchPlaceProps } from "core";
import { SearchSummary } from "../shared";

type SearchFeatureCollectionProps = SearchSummary & {
    queryIntent?: QueryIntent[];
};

export type SearchResponse = Places<SearchPlaceProps, SearchFeatureCollectionProps>;

/**
 *
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/search-service
 */
export const search = async (
    params: GeometrySearchParams | FuzzySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate | FuzzySearchTemplate>
): Promise<SearchResponse> => {
    if ("geometries" in params) {
        return geometrySearch(params, customTemplate as GeometrySearchTemplate);
    } else {
        return fuzzySearch(params, customTemplate as FuzzySearchTemplate);
    }
};

export default search;
