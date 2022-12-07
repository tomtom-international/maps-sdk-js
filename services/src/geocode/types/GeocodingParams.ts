import { GeographyType, HasBBox, HasLngLat, MapcodeType, View } from "@anw/go-sdk-js/core";
import { IndexTypesAbbreviation } from "../../shared/types/APIResponseTypes";
import { CommonSearchParams } from "../../search/types/CommonSearchParams";

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
>;
