import type { CommonSearchPlaceResultAPI, SummaryAPI } from '../../shared/types/apiPlacesResponseTypes';

/**
 * @ignore
 */
export type AlongRouteSearchResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 */
export type AlongRouteSearchResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: SummaryAPI;
    /**
     * The result list, sorted by detour time or offset.
     */
    results: AlongRouteSearchResultAPI[];
};
