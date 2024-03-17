import type { CommonSearchPlaceResultAPI, SummaryAPI } from "../../shared/types/apiPlacesResponseTypes";

/**
 * @ignore
 */
export type GeometrySearchResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 */
export type GeometrySearchResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: SummaryAPI;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeometrySearchResultAPI[];
};
