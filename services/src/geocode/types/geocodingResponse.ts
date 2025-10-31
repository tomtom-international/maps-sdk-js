import type { Places, PlaceType, SearchPlaceProps } from '@tomtom-org/maps-sdk/core';

/**
 * Place type for geocoding results.
 *
 * Excludes POI from the standard PlaceType union, as geocoding specifically
 * handles administrative and address-level entities rather than points of interest.
 *
 * @group Geocoding
 */
type GeocodingPlaceType = Exclude<PlaceType, 'POI'>;

/**
 * Properties specific to geocoding search results.
 *
 * Extends search place properties with geocoding-specific information,
 * including match confidence scoring to indicate how well the result matches
 * the input query. The info property is excluded as it's not used in geocoding responses.
 *
 * @group Geocoding
 */
export type GeocodingProps = Omit<SearchPlaceProps, 'info'> & {
    /**
     * The type of place (Address, Street, Geography, etc).
     *
     * POI type is excluded as geocoding focuses on administrative and address entities.
     */
    type: GeocodingPlaceType;
    /**
     * The confidence of the result's textual match with the query.
     *
     * Indicates how well the returned result matches the input query text.
     * Higher scores represent better textual matches.
     */
    matchConfidence: { score: number };
};

/**
 * Response from the geocoding service.
 *
 * Collection of places matching the geocoding query, each with address information
 * and match confidence scoring.
 *
 * @group Geocoding
 */
export type GeocodingResponse = Places<GeocodingProps>;
