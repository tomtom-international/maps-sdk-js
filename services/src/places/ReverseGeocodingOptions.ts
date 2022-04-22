import { HasLngLat, View } from "core/src";

export type EntityType =
    | "Country"
    | "CountrySubdivision"
    | "CountrySecondarySubdivision"
    | "CountryTertiarySubdivision"
    | "Municipality"
    | "MunicipalitySubdivision"
    | "Neighbourhood"
    | "PostalCodeArea";

// TODO: review, cleanup & improve
export type ReverseGeocodingOptions = {
    /**
     * Format of newlines in the formatted address.
     *
     * Format of newlines in the formatted address.
     * If true, the address will contain newlines.
     * Otherwise, newlines will be converted to spaces.
     * @default None
     */
    allowFreeformNewline?: boolean;

    /**
     * This parameter specifies the level of filtering performed on geographies.
     * Providing the parameter narrows the search for the specified geography entity types.
     * The resulting response will contain the geography ID as well as the entity type matched.
     * This ID is a token that can be used to get the geometry of that geography.
     * The following parameters are ignored when entityType is set:
     * heading, number, returnRoadUse, returnSpeedLimit, roadUse, and returnMatchType.
     * @default None
     */
    entityType?: EntityType | EntityType[];

    /**
     * The directional heading of the vehicle in degrees for travel along a
     * segment of roadway.
     * 0 is North, 90 is East and so on. Values range from -360 to 360. The precision can include
     * up to one decimal place.
     *
     * Makes it possible to get the address information of the road, keeping in mind the direction.
     * @default None
     */
    heading?: number;

    /**
     * A valid API Key for the requested service.
     *
     * A valid API Key is required to make use of the given service.
     * It can be issued in the Developer Portal.
     * @default None
     */
    key: string;

    /**
     * Language code that decides in which language the results
     * should be returned.
     *
     * The value should correspond to one of the supported IETF language codes.
     * The list is available here.
     * The code is case insensitive.
     * @default null
     */
    language?: string;

    /**
     * Enables the return of a comma-separted mapcodes list.
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
    mapcodes?: string;

    /**
     * The date and time used to return time zone information.
     * * It allows the service to decide whether the Daylight Saving Time time zone should be used or not.
     * * It must conform to RFC 3339.
     */
    dateTime?: string;

    /**
     * Street number as a string.
     *
     * If a street number is sent in along with the request, the response may
     * include the side of the street (Left/Right), and also an offset position for that street number.
     * @default None
     */
    number?: string;

    /**
     * The protocol type to be used in the calls.
     *
     * Represents the type of protocol used to perform a service call.
     * @default "https"
     */
    protocol?: "http" | "https";

    /**
     * A positive integer value in meters.
     *
     * This option specifies the search radius in meters using the coordinates given to the center
     * option as origin.
     * @default None
     */
    radius?: number;

    /**
     * Type of match.
     *
     * Includes information on the type of match the geocoder achieved in the response.
     * @default None
     */
    returnMatchType?: boolean;

    /**
     * Enable or disable the feature.
     *
     * Requires including a road use array for reversegeocodes at street level.
     * @default None
     */
    returnRoadUse?: boolean;

    /**
     * Enable or disable the feature.
     *
     * Allows, if possible, the receiving of speed limit information at the given location.
     * @default None
     */
    returnSpeedLimit?: boolean;

    /**
     * An array of strings, or just one string with comma-separated values.
     *
     * Use this option if you want to restrict the result to one, or a group of the following road uses:
     * "LimitedAccess"
     * "Arterial"
     * "Terminal"
     * "Ramp"
     * "Rotary"
     * "LocalStreet"
     * @default None
     */
    roadUse?: string[] | string;

    /**
     * The street's number.
     *
     * Represents the street's number for the structured address.
     * @default None
     */
    streetNumber?: string;

    /**
     * The new value to be set.
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
};
