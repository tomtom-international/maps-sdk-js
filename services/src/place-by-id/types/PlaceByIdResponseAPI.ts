import { CommonSearchPlaceResultAPI, Summary } from "../../shared/types/APIResponseTypes";

/**
 * @ignore
 * @group Place By Id
 * @category Types
 */
export type PlaceByIdResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 * @group Place By Id
 * @category Types
 */
export type PlaceByIdResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: PlaceByIdResultAPI[];
};
