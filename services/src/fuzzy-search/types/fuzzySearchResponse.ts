import type { Places, SearchPlaceProps } from '@cet/maps-sdk-js/core';
import type { Position } from 'geojson';
import type { SearchSummary } from '../../shared';

export type FuzzySearchResponse = Places<SearchPlaceProps, FuzzySearchFeatureCollectionProps>;

type FuzzySearchFeatureCollectionProps = SearchSummary & {
    queryIntent: QueryIntent[];
};

export type QueryIntent = CoordinateIntent | NearbyIntent | W3WIntent | BookmarkIntent;

export type CoordinateIntent = {
    /**
     * the query is a coordinate in one of the supported formats (e.g., "48.858380, 2.294440").
     */
    type: 'COORDINATE';
    details: CoordinateIntentDetails;
};

export type NearbyIntent = {
    /**
     * the query asks for some entity in the proximity of another entity (e.g., "hotel near Lyon").
     */
    type: 'NEARBY';
    details: NearbyIntentDetails;
};

export type W3WIntent = {
    /**
     * the query contains a (likely) what3words code (e.g., "///classic.calls.replace").
     */
    type: 'W3W';
    details: W3WIntentDetails;
};

export type BookmarkIntent = {
    /**
     * the query contains one or more keywords that can refer to saved locations (e.g., "home").
     */
    type: 'BOOKMARK';
    details: BookmarkIntentDetails;
};

export type CoordinateIntentDetails = {
    /**
     * position of the (parsed) user input coordinate. The results will be places nearby this coordinate.
     * If position parameter is specified, the dist field will have the distance between the geoBias and the searched coordinate.
     */
    position: Position;
};

export type NearbyIntentDetails = {
    /**
     * position of the place, near which the user searches for something.
     * For example, for the input restaurant near Berlin central station this is the position of "Berlin Central Station".
     * If lat and lon parameters are specified, the dist field will have the distance between the geoBias and the returned restaurants.
     */
    position: Position;

    /**
     * Normalized phrase referring to what the user is searching for near some place.
     * For example, for the input restaurant near Berlin central station the query is restaurant.
     */
    query: string;
    /**
     * Normalized phrase referring to where the user is searching for some place.
     * For example, for the input restaurant near Berlin central station the text is berlin central station.
     */
    text: string;
};

export type W3WIntentDetails = {
    /**
     * What3words address. For example, for the query classic.calls.replace the address is ///classic.calls.replace.
     * You can use the what3words service to convert this address to a coordinate.
     */
    address: string;
};

export type BookmarkIntentDetails = {
    /**
     * One of: HOME, WORK. The user possibly searched for a bookmark in your application.
     * You probably want to suggest the user's home or work address as a search result.
     */
    bookmark: string;
};
