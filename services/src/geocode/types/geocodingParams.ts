import type { CommonPlacesParams, CommonGeocodeAndFuzzySearchParams, SearchIndexType } from "../../shared";
import type { GeocodingResponseAPI } from "./apiTypes";

type GeocodingIndexTypesAbbreviation = Exclude<SearchIndexType, "POI">;

export type GeocodingParams = Omit<
    CommonPlacesParams<URL, GeocodingResponseAPI> & CommonGeocodeAndFuzzySearchParams,
    "extendedPostalCodesFor"
> & {
    /**
     * Indexes for which extended postal codes should be included in the results.
     * Available values are described in Additional Information indexes abbreviation values section.
     * By default, extended postal codes are included for all indexes except Geo.
     * Extended postal code lists for geographies can be quite long, so they have to be explicitly requested when needed.
     * Ex. extendedPostalCodesFor=[PAD, Addr, POI]
     */
    extendedPostalCodesFor?: GeocodingIndexTypesAbbreviation[];
};
