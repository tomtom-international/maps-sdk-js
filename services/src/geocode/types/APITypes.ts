import {
    AddressRangesAPI,
    BoundingBoxAPI,
    EntryPointAPI,
    LatLonAPI,
    Summary,
    ViewportAPI
} from "../../shared/types/APIResponseTypes";
import { GeocodingProps } from "./GeocodingResponse";

type GeocodingResultAPI = Omit<
    GeocodingProps,
    "distance" | "position" | "boundingBox" | "viewport" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    position: LatLonAPI;
    dist?: number;
    boundingBox?: BoundingBoxAPI;
    viewport?: ViewportAPI;
    entityType?: string;
    entryPoints?: EntryPointAPI[];
    addressRanges?: AddressRangesAPI;
};

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: Summary;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeocodingResultAPI[];
};
