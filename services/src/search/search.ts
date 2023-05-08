import { Places, SearchPlaceProps } from "@anw/maps-sdk-js/core";
import { GeometrySearchParams } from "../geometry-search";
import { geometrySearch } from "../geometry-search/geometrySearch";
import { GeometrySearchTemplate } from "../geometry-search/geometrySearchTemplate";
import { FuzzySearchParams, QueryIntent } from "../fuzzy-search";
import { fuzzySearch } from "../fuzzy-search/fuzzySearch";
import { FuzzySearchTemplate } from "../fuzzy-search/fuzzySearchTemplate";
import { SearchSummary } from "../shared";

type SearchFeatureCollectionProps = SearchSummary & {
    queryIntent?: QueryIntent[];
};

export type SearchResponse = Places<SearchPlaceProps, SearchFeatureCollectionProps>;

/**
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/search-service
 */
export const search = async (
    params: GeometrySearchParams | FuzzySearchParams,
    customTemplate?: Partial<GeometrySearchTemplate | FuzzySearchTemplate>
): Promise<SearchResponse> =>
    "geometries" in params
        ? geometrySearch(params, customTemplate as GeometrySearchTemplate)
        : fuzzySearch(params, customTemplate as FuzzySearchTemplate);

export default search;
