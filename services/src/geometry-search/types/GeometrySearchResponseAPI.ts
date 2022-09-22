import {
    AddressProperties,
    Brand,
    Category,
    Classification,
    CommonLocationProps,
    LocationType,
    OpeningHours,
    TimeZone
} from "@anw/go-sdk-js/core";
import { Polygon } from "geojson";

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

type GeometrySearchPropsAPI = CommonLocationProps & {
    type: LocationType;
    /**
     The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
    /**
     * Optional section. Only present if type == Geography.
     * A bounding box which can be used to display the result on a map defined by minimum and maximum longitudes and latitudes.
     */
    boundingBox?: Polygon;
};

type GeometrySearchResultAPI = Omit<
    GeometrySearchPropsAPI,
    "distance" | "position" | "boundingBox" | "viewport" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    position: LatLonAPI;
    viewport?: ViewportAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
    info?: string;
    poi?: POIAPI;
};

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
