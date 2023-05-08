import { CommonSearchPlaceResultAPI, SummaryAPI } from "../../shared";
import { BookmarkIntent, NearbyIntentDetails, W3WIntent } from "./fuzzySearchResponse";

/**
 * @ignore
 */
export type FuzzySearchResultAPI = CommonSearchPlaceResultAPI;

/**
 * @ignore
 */
export type FuzzySearchResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: SummaryAPI & {
        queryIntent: QueryIntentAPI[];
    };
    /**
     * The result list, sorted in descending order by score.
     */
    results: FuzzySearchResultAPI[];
};

/**
 * @ignore
 */
export type QueryIntentAPI = CoordinateIntentAPI | NearbyIntentAPI | W3WIntent | BookmarkIntent;

/**
 * @ignore
 */
export type CoordinateIntentAPI = {
    /**
     * the query is a coordinate in one of the supported formats (e.g., "48.858380, 2.294440").
     */
    type: "COORDINATE";
    details: CoordinateIntentDetailsAPI;
};

/**
 * @ignore
 */
export type NearbyIntentAPI = {
    /**
     * the query asks for some entity in the proximity of another entity (e.g., "hotel near Lyon").
     */
    type: "NEARBY";
    details: NearbyIntentDetailsAPI;
};

/**
 * @ignore
 */
export type CoordinateIntentDetailsAPI = {
    /**
     * Latitude of the (parsed) user input coordinate. See LatLon. The results will be places nearby this coordinate.
     * If lat and lon parameters are specified, the dist field will have the distance between the geoBias and the searched coordinate.
     */
    lat: number;
    /**
     * Longitude of the (parsed) user input coordinate.
     */
    lon: number;
};

/**
 * @ignore
 */
export type NearbyIntentDetailsAPI = Omit<NearbyIntentDetails, "position"> & {
    /**
     * Latitude of the place, near which the user searches for something.
     * For example, for the input restaurant near Berlin central station this is the position of "Berlin Central Station".
     * If lat and lon parameters are specified, the dist field will have the distance between the geoBias and the returned restaurants.
     */
    lat: number;
    /**
     * Longitude of the place, near which the user searches for something.
     */
    lon: number;
};
