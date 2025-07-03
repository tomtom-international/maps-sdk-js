import type { MapcodeType, OpeningHoursMode, View } from '@anw/maps-sdk-js/core';
import type { CommonServiceParams, RelatedPoisRequest, TimeZoneRequest } from '../../shared';
import type { PlaceByIdResponseAPI } from './placeByIdResponseAPI';

export type PlaceByIdOptionalParams = {
    /**
     * Enables the return of a comma-separated mapcodes list.
     * It can also filter the response to only show selected mapcode types. See Mapcodes in the response.
     * Values: One or more of:
     * * `Local`
     * * `International`
     * * `Alternative`
     *
     * A mapcode represents a specific location, to within a few meters.
     * Every location on Earth can be represented by a mapcode. Mapcodes are designed to be short,
     * easy to recognize, remember, and communicate. Visit the Mapcode project website for more information.
     */
    mapcodes?: MapcodeType[];
    /**
     * Geopolitical View. The context used to resolve the handling of disputed territories.
     *
     * Sets or returns the view option value to be used in the calls.
     * Can be one of "Unified", "AR", "IN", "PK", "IL, "MA", "RU", "TR" and "CN".
     * Legend:
     * Unified - International view
     * AR - Argentina
     * IN - India
     * PK - Pakistan
     * IL - Israel
     * MA - Morocco
     * RU - Russia
     * TR - Turkey
     * CN - China
     * @default None
     */
    view?: View;
    /**
     * List of opening hours for a POI (Points of Interest).
     */
    openingHours?: OpeningHoursMode;
    /**
     * Used to indicate the mode in which the timeZone object should be returned.
     */
    timeZone?: TimeZoneRequest;
    /**
     * An optional parameter that provides the possibility to return related Points Of Interest.
     * Default value: off
     * Points Of Interest can be related to each other when one is physically part of another. For example, an airport terminal can physically belong to an airport. This relationship is expressed as a parent/child relationship: the airport terminal is a child of the airport. If the value child or parent is given, a related Points Of Interest with a specified relation type will be returned in the response. If the value all is given, then both child and parent relations are returned.
     */
    relatedPois?: RelatedPoisRequest;
};

export type PlaceByIdMandatoryParams = {
    /**
     * The unique POI identifier (mandatory).
     */
    entityId: string;
};

export type PlaceByIdParams = CommonServiceParams<URL, PlaceByIdResponseAPI> &
    PlaceByIdMandatoryParams &
    PlaceByIdOptionalParams;
