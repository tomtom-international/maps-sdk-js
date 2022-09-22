import { GeographyType, MapcodeType, View, ConnectorType, Fuel } from "@anw/go-sdk-js/core";
import { Geometry, Position } from "geojson";

import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { CommonServiceParams } from "../../shared/ServiceTypes";

type RelatedPoisRequest = "child" | "parent" | "all" | "off";

type OpeningHoursRequest = "nextSevenDays";

type TimeZoneRequest = "iana";

type ConnectorRequest = ConnectorType;

export type GeometrySearchRequest = CommonServiceParams & {
    /**
     * Query string. Must be properly URL encoded (mandatory).
     */
    query: string;

    /**
     * List of geometries to search.
     * * (Also referred to as "geometryList")
     */
    geometries: GeometrySDK[];

    /**
     * The maximum number of responses that will be returned.
     * @default 10
     * Maximum value: 100
     */
    limit?: number;

    /**
     * Indexes for which extended postal codes should be included in the results.
     * Available values are described in Additional Information indexes abbreviation values section.
     * By default, extended postal codes are included for all indexes except Geo.
     * Extended postal code lists for geographies can be quite long, so they have to be explicitly requested when needed.
     * Ex. extendedPostalCodesFor=[PAD, Addr, POI]
     */
    extendedPostalCodesFor?: IndexTypesAbbreviation[];
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
     * A list of geography types which can be used to restrict the result to the Geography result of a specific type.
     * If geographyTypeSet is specified, only a Geography result with a proper entity type will be returned.
     * Available values: Country | CountrySubdivision | CountrySecondarySubdivision | CountryTertiarySubdivision | Municipality | MunicipalitySubdivision | Neighbourhood | PostalCodeArea
     */
    geographyType?: GeographyType[];
    /**
     * Parameter allows for fine-tuning Search by specifying which indexes to utilize for the search
     */
    indexes?: IndexTypesAbbreviation[];
    /**
     * A list of categories which could be used to restrict the result to the Points Of Interest of specific categories.
     * * The list of categories can be discovered using the POI Categories endpoint.
     * * Value: A list of category identifiers (in any order). When multiple category identifiers are provided, only POIs that belong to (at least) one of the categories from the provided list will be returned.
     * * Examples: [7315025, 7315017] (search Points Of Interest of a category, in this example an Italian (italian) or French (french) Restaurant
     */
    poiCategories?: number[];
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
    connectors?: ConnectorRequest[];
    /**
     * A list of fuel types which could be used to restrict the result to the Points Of Interest of specific fuels. If fuelSet is specified, the query can remain empty. Only POIs with a proper fuel type will be returned.
     */
    fuels?: Fuel[];
    /**
     * List of opening hours for a POI (Points of Interest).
     */
    openingHours?: OpeningHoursRequest;
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
    /**
     * A comma-separated list of entity types which can be used to restrict the result to a specific entity type. Parameter should be used with the idxSet parameter set to the Geography value.
     * Value: A list of entity types. Item order in the list does not matter. Values are case sensitive.
     */
    entityTypes?: GeographyType[];
};

export type GeometrySDK = Geometry | Circle;

// geo-json does not support circle as a Geometry shape
export interface Circle {
    type: "Circle";
    coordinates: Position;
    radius: number;
}
