import { CommonSearchPlaceResultAPI, SummaryAPI } from "../../shared";

/**
 * @ignore
 * @group Geometry Search
 * @category Types
 */
export type GeometrySearchResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 * @group Geometry Search
 * @category Types
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
