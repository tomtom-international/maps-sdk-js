import { AddressProperties, SearchPlaceProps } from "@anw/go-sdk-js/core";

import { EntryPointAPI, LatLonAPI, POIAPI, Summary, ViewportAPI } from "../../shared/types/APIResponseTypes";

/**
 * @ignore
 * @group Place By Id
 * @category Types
 */
export type PlaceByIdResultAPI = Omit<
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
 * @group Place By Id
 * @category Types
 */
export type PlaceByIdResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: PlaceByIdResultAPI[];
};
