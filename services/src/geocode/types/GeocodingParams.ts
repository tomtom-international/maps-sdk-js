import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { CommonServiceParams } from "../../shared/ServiceTypes";
import { GeographyType, HasLngLat, MapcodeType, View } from "@anw/go-sdk-js/core";
import { Polygon } from "geojson";

type GeocodingIndexTypesAbbreviation = Exclude<IndexTypesAbbreviation, "POI">;

export type GeocodingParams = CommonServiceParams & {
    /**
     * Query string. Must be properly URL encoded (mandatory).
     */
    query: string;

    /**
     * If the typeahead flag is set, the query will be interpreted as a partial input,
     * and the search will enter predictive mode.
     * @default false
     */
    typeahead?: boolean;

    /**
     * The maximum number of responses that will be returned.
     * @default 10
     * Maximum value: 100
     */
    limit?: number;

    /**
     * The starting offset of the returned results within the full result set.
     * The total number of results can be no more than 2000
     * If you want to receive all the results, you need to limit the number of results by using for example the radius parameter.
     * @default 0
     * Maximum value: 1900
     */
    offset?: number;

    /**
     * Position where results should be biased.
     * Note: supplying a lat/lon without a radius will bias the search results to that area.
     */
    position?: HasLngLat;

    /**
     * Country code or List of country codes in ISO 3166-1 alpha-2 or alpha-3 code formats
     * This will limit the search to the specified countries.
     * The choice of view may restrict which countries are available.
     * Visit the Search API Market Coverage page for a list of all the countries supported by the Search engine.
     */
    countrySet?: string[];

    /**
     * If radius and position are set, the results will be constrained to the defined area.
     * The radius parameter is specified in meters.
     */
    radius?: number;

    /**
     * Top-left position of the bounding box.
     *
     * Important note: Point-Radius parameters and Bounding Box parameters are mutually exclusive.
     * Point-Radius parameters take precedence when both are passed.
     */
    boundingBox?: Polygon;

    /**
     * Indexes for which extended postal codes should be included in the results.
     * Available values are described in Additional Information indexes abbreviation values section.
     * By default, extended postal codes are included for all indexes except Geo.
     * Extended postal code lists for geographies can be quite long, so they have to be explicitly requested when needed.
     * Ex. extendedPostalCodesFor=[PAD, Addr, POI]
     */
    extendedPostalCodesFor?: GeocodingIndexTypesAbbreviation[];

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
     * A list of entity types which can be used to restrict the result to the Geography result of a specific entity type.
     * If entityTypeSet is specified, only a Geography result with a proper entity type will be returned.
     */
    entityTypeSet?: GeographyType[];
};
