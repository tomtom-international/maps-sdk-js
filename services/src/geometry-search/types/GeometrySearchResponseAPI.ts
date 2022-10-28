import { AddressProperties } from "@anw/go-sdk-js/core";

import { EntryPointAPI, LatLonAPI, POIAPI, Summary, ViewportAPI } from "../../shared/types/APIResponseTypes";
import { SearchPlaceProps } from "core";

/**
 * @ignore
 * @group Geometry-Search
 * @category Types
 */
export type GeometrySearchResultAPI = Omit<
    SearchPlaceProps,
    "position" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    id: string;
    position: LatLonAPI;
    viewport?: ViewportAPI;
    entryPoints?: EntryPointAPI[];
    address?: AddressProperties;
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
