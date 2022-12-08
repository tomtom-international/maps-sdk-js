import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { CommonSearchParams } from "../../search";

type GeocodingIndexTypesAbbreviation = Exclude<IndexTypesAbbreviation, "POI">;

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingParams = Omit<
    CommonSearchParams,
    | "indexes"
    | "poiCategories"
    | "poiBrands"
    | "connectors"
    | "fuelTypes"
    | "openingHours"
    | "timeZone"
    | "relatedPois"
    | "minPowerKW"
    | "maxPowerKW"
    | "extendedPostalCodesFor"
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
