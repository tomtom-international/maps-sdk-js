import { AddressProperties, CommonPlaceProps, PlaceType } from "@anw/go-sdk-js/core";

import { EntryPointAPI, LatLonAPI, POIAPI, Summary, ViewportAPI } from "../../shared/types/APIResponseTypes";

/**
 * @ignore
 * @group Geometry-Search
 * @category Types
 */
export type GeometrySearchResultAPI = Omit<
    CommonPlaceProps,
    "distance" | "position" | "viewport" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    id: string;
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
