import type { Places, SearchPlaceProps } from '@tomtom-org/maps-sdk-js/core';
import type { Position } from 'geojson';
import type { SearchSummary } from '../../shared';

/**
 * Response from the fuzzy search service.
 *
 * Collection of places matching the search query, with additional metadata
 * about detected query intents (coordinates, nearby searches, what3words, bookmarks).
 *
 * @group Fuzzy Search
 */
export type FuzzySearchResponse = Places<SearchPlaceProps, FuzzySearchFeatureCollectionProps>;

/**
 * Additional properties for fuzzy search feature collection.
 *
 * Extends the base search summary with detected query intents that provide
 * insight into how the search engine interpreted the user's query.
 *
 * @group Fuzzy Search
 */
type FuzzySearchFeatureCollectionProps = SearchSummary & {
    /**
     * Array of detected query intents.
     *
     * Indicates how the search engine interpreted the query
     * (e.g., as coordinates, nearby search, what3words, or bookmark).
     */
    queryIntent: QueryIntent[];
};

/**
 * Union type for all possible query intents.
 *
 * Represents different ways the search engine can interpret a user's query,
 * helping applications provide more contextual results.
 *
 * @group Fuzzy Search
 */
export type QueryIntent = CoordinateIntent | NearbyIntent | W3WIntent | BookmarkIntent;

/**
 * Intent indicating the query is a coordinate.
 *
 * Detected when the query matches a coordinate format
 * (e.g., "48.858380, 2.294440" or "52°31'N 13°24'E").
 *
 * @group Fuzzy Search
 */
export type CoordinateIntent = {
    /**
     * Query type identifier.
     *
     * The query is a coordinate in one of the supported formats.
     */
    type: 'COORDINATE';
    /**
     * Details about the detected coordinate.
     */
    details: CoordinateIntentDetails;
};

/**
 * Intent indicating a proximity-based search.
 *
 * Detected when the query asks for entities near a location
 * (e.g., "hotel near Lyon" or "restaurants near me").
 *
 * @group Fuzzy Search
 */
export type NearbyIntent = {
    /**
     * Query type identifier.
     *
     * The query asks for entities in proximity to another entity.
     */
    type: 'NEARBY';
    /**
     * Details about the nearby search parameters.
     */
    details: NearbyIntentDetails;
};

/**
 * Intent indicating the query contains a what3words address.
 *
 * Detected when the query matches the what3words format
 * (e.g., "///classic.calls.replace").
 *
 * @group Fuzzy Search
 */
export type W3WIntent = {
    /**
     * Query type identifier.
     *
     * The query contains a (likely) what3words code.
     */
    type: 'W3W';
    /**
     * Details about the detected what3words address.
     */
    details: W3WIntentDetails;
};

/**
 * Intent indicating the query references a saved location.
 *
 * Detected when the query contains keywords for bookmarked locations
 * (e.g., "home", "work").
 *
 * @group Fuzzy Search
 */
export type BookmarkIntent = {
    /**
     * Query type identifier.
     *
     * The query contains keywords that can refer to saved locations.
     */
    type: 'BOOKMARK';
    /**
     * Details about the detected bookmark keyword.
     */
    details: BookmarkIntentDetails;
};

/**
 * Details for a coordinate query intent.
 *
 * Contains the parsed coordinate position from the user's query.
 *
 * @group Fuzzy Search
 */
export type CoordinateIntentDetails = {
    /**
     * Position of the parsed coordinate from user input.
     *
     * Results will be places nearby this coordinate. If a position parameter
     * was also specified in the request, the distance field will show the
     * distance between the geo bias and the searched coordinate.
     */
    position: Position;
};

/**
 * Details for a nearby search query intent.
 *
 * Contains information about what the user is searching for and where,
 * extracted from proximity-based queries.
 *
 * @group Fuzzy Search
 */
export type NearbyIntentDetails = {
    /**
     * Position of the reference location in the nearby search.
     *
     * For example, for "restaurant near Berlin central station", this is
     * the position of Berlin Central Station. If position parameters were
     * specified in the request, the distance field will show the distance
     * between the geo bias and the returned results.
     */
    position: Position;

    /**
     * Normalized phrase for what the user is searching for.
     *
     * For example, for "restaurant near Berlin central station",
     * the query is "restaurant".
     */
    query: string;
    /**
     * Normalized phrase for the reference location.
     *
     * For example, for "restaurant near Berlin central station",
     * the text is "berlin central station".
     */
    text: string;
};

/**
 * Details for a what3words query intent.
 *
 * Contains the detected what3words address that can be converted to coordinates.
 *
 * @group Fuzzy Search
 */
export type W3WIntentDetails = {
    /**
     * The detected what3words address.
     *
     * For example, for the query "classic.calls.replace", the address is
     * "///classic.calls.replace". Use the what3words service to convert
     * this address to coordinates.
     */
    address: string;
};

/**
 * Details for a bookmark query intent.
 *
 * Contains the bookmark keyword detected in the query.
 *
 * @group Fuzzy Search
 */
export type BookmarkIntentDetails = {
    /**
     * The detected bookmark keyword.
     *
     * Currently supports "HOME" and "WORK". Applications should suggest
     * the user's saved home or work address as a search result.
     */
    bookmark: string;
};
