import { CommonSearchPlaceResultAPI, Summary } from "../../shared/types/APIResponseTypes";

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
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeometrySearchResultAPI[];
};
