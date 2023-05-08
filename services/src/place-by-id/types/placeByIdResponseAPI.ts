import { CommonSearchPlaceResultAPI, SummaryAPI } from "../../shared";

/**
 * @ignore
 */
export type PlaceByIdResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 */
export type PlaceByIdResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: SummaryAPI;
    /**
     * The result list, sorted in descending order by score.
     */
    results: PlaceByIdResultAPI[];
};
