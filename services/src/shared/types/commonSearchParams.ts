import { ConnectorType, Fuel, OpeningHoursMode, POICategory } from "@anw/maps-sdk-js/core";
import { CommonPlacesParams, SearchIndexType } from "./commonPlacesParams";
import { RelatedPoisRequest, TimeZoneRequest } from "./servicesTypes";

/**
 * Common parameters related to search services.
 * @see https://developer.tomtom.com/search-api/documentation/search-service/search-service
 */
export type CommonSearchParams<API_REQUEST, API_RESPONSE> = CommonPlacesParams<API_REQUEST, API_RESPONSE> & {
    /**
     * Parameter allows for fine-tuning Search by specifying which indexes to utilize for the search.
     */
    indexes?: SearchIndexType[];

    /**
     * A list of categories which could be used to restrict the result to the Points Of Interest of specific categories.
     * * The list of categories can be discovered using the POI Categories endpoint.
     * * Value: A list of category identifiers (in any order). When multiple category identifiers are provided, only POIs that belong to (at least) one of the categories from the provided list will be returned.
     * * Examples: [7315025, 7315017] (search Points Of Interest of a category, in this example an Italian (italian) or French (french) Restaurant
     */
    poiCategories?: (number | POICategory)[];

    /**
     * A comma-separated list of brand names which could be used to restrict the result to Points Of Interest of specific brands.
     * Value: A comma-separated list of brand names (in any order). When multiple brands are provided, only POIs that belong to (at least) one of the brands from the provided list will be returned. Brands that contain a "," (comma) in their name should be put into quotes, for example: "A,B,C".
     * Usage examples:
     *
     *     ["Tomtom"] (search Points Of Interest of the "Tomtom" brand)
     *     ["Tomtom", "Foobar"] (search Points Of Interest of the "Tomtom" brand OR "Foobar" brand)
     */
    poiBrands?: string[];

    /**
     * A comma-separated list of connector types which could be used to restrict the result to the Points Of Interest of type Electric Vehicle Station supporting specific connector types. See the list of Supported Connector Types.
     * Value: A list of connector types (in any order). When multiple connector types are provided, only POIs that support (at least) one of the connector types from the provided list will be returned.
     */
    connectors?: ConnectorType[];

    /**
     * A list of fuel types which could be used to restrict the result to the Points Of Interest of specific fuels.
     * If fuelSet is specified, the query can remain empty. Only POIs with a proper fuel type will be returned.
     */
    fuelTypes?: Fuel[];

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

    /**
     * An optional parameter which could be used to restrict the result to the Points Of Interest of type Electric Vehicle Station supporting at least one connector with a specific minimal value of power in kilowatts (closed interval - with that value).
     * Value: A double value representing the power rate in kilowatts.
     */
    minPowerKW?: number;

    /**
     * An optional parameter which could be used to restrict the result to the Points Of Interest of type Electric Vehicle Station supporting at least one connector with a specific maximum value of power in kilowatts (closed interval - with that value).
     * Value: A double value representing the power rate in kilowatts.
     */
    maxPowerKW?: number;
};
