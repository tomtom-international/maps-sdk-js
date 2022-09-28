import {
    AddressProperties,
    Brand,
    Category,
    Classification,
    CommonPlaceProps,
    PlaceType,
    OpeningHours,
    TimeZone
} from "@anw/go-sdk-js/core";

import { EntryPointAPI, LatLonAPI, Summary, ViewportAPI } from "../../shared/types/APIResponseTypes";

type POIAPI = {
    name: string;
    phone?: string;
    brands?: Brand[];
    url?: string;
    // category ids
    categorySet?: Category[];
    // Example: Array(2) [café/pub, internet café]
    categories?: string[];
    openingHours?: OpeningHours;
    classifications?: Classification[];
    timeZone?: TimeZone;
};

/**
 * @ignore
 * @group Geometry-Search
 * @category Types
 */
export type GeometrySearchResultAPI = Omit<
    CommonPlaceProps,
    "distance" | "position" | "viewport" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    type: PlaceType;
    matchConfidence: { score: number };
    position: LatLonAPI;
    viewport?: ViewportAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
    info?: string;
    poi?: POIAPI;
};

/**
 * @ignore
 * @group Geometry-Search
 * @category Types
 */
export type GeometrySearchResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeometrySearchResultAPI[];
};
