import { HasLngLat } from "@anw/go-sdk-js/core";
import { CommonServiceParams } from "../../shared";
/**
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteSearchSegmentType = "brand" | "category" | "plaintext";

/**
 * @group Autocomplete
 * @category Types
 */
export type AutocompleteSearchParams = Omit<CommonServiceParams, "language"> & {
    /**
     * Query string. Must be properly URL encoded (Mandatory).
     */
    query: string;

    /**
     * Language in which autocomplete results should be returned (Mandatory).
     * Value: One of the TomTom IETF Supported Language Tags.
     * @see Supported Language https://developer.tomtom.com/search-api/documentation/product-information/supported-languages
     */
    language: string;

    /**
     * Position where results should be biased.
     * Note: supplying a lat/lon without a radius will bias the search results to that area.
     * Latitude Values: min/max: -90 to +90
     * Longitude Values: min/max: -180 to +180
     */
    position?: HasLngLat;

    /**
     * The maximum number of responses that will be returned.
     * @default 10
     * Maximum value: 100
     */
    limit?: number;

    /**
     * If radius and position are set the results will be constrained to the defined area.
     * The radius parameter is specified in meters.
     * Valid radius values are numbers greater than 0.
     * Supplying values equal to or lesser than 0 causes the parameter to be ignored.
     */
    radiusMeters?: number;

    /**
     * list of country codes in ISO 3166-1 alpha-2 or alpha-3 code formats (e.g., FR,ES or FRA,ESP).
     * This will limit the search to the specified countries. The choice of view may restrict which countries are available.
     */
    countries?: string[];

    /**
     * Restricts the result space based on their segment types.
     * A result is only included if it contains a segment of the indicated types.
     * Value: An array that consists of the types of segments.
     *
     * Usage examples:
     * ["category"], ["brand"], ["category", "brand"]
     */
    resultType?: AutocompleteSearchSegmentType[];
};
