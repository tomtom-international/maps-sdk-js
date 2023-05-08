import { CommonSearchPlaceResultAPI, SummaryAPI } from "../../shared";

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
