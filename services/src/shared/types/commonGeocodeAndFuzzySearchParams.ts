import { HasBBox } from "@anw/maps-sdk-js/core";

/**
 * Common parameters between fuzzy search and geocoding.
 */
export type CommonGeocodeAndFuzzySearchParams = {
    /**
     * If the typeahead flag is set, the query will be interpreted as a partial input, and the search will enter predictive mode.
     * @default false
     */
    typeahead?: boolean;

    /**
     * Starting offset of the returned results within the full result set.
     * @default 0
     */
    offset?: number;

    /**
     * If radius and position are set the results will be constrained to the defined area.
     * The radius parameter is specified in meters.
     * Valid radius values are numbers greater than 0.
     * Supplying values equal to or lesser than 0 causes the parameter to be ignored.
     */
    radiusMeters?: number;

    /**
     * Bounding box to filter the results.
     * * It accepts a GeoJSON bounding box or any GeoJSON shape which contains a bbox,
     * or from which a bbox can be calculated.
     *
     * * Important note: Point-Radius parameters and Bounding Box parameters are mutually exclusive.
     * Point-Radius parameters take precedence when both are passed.
     */
    boundingBox?: HasBBox;

    /**
     * list of country codes in ISO 3166-1 alpha-2 or alpha-3 code formats (e.g., FR,ES or FRA,ESP).
     * This will limit the search to the specified countries. The choice of view may restrict which countries are available.
     */
    countries?: string[];
};
