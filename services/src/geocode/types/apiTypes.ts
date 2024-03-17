import type {
    AddressRangesAPI,
    BoundingBoxAPI,
    EntryPointAPI,
    LatLonAPI,
    SummaryAPI,
    ViewportAPI
} from "../../shared/types/apiPlacesResponseTypes";
import type { GeocodingProps } from "./geocodingResponse";

/**
 * @ignore
 */
export type GeocodingResultAPI = Omit<
    GeocodingProps,
    "distance" | "position" | "boundingBox" | "addressRanges" | "geographyType" | "entryPoints"
> & {
    id: string;
    position: LatLonAPI;
    dist?: number;
    boundingBox?: BoundingBoxAPI;
    viewport?: ViewportAPI;
    entityType?: string;
    entryPoints?: EntryPointAPI[];
    addressRanges?: AddressRangesAPI;
};

/**
 * @ignore
 */
export type GeocodingResponseAPI = {
    /**
     * Summary information about the search that was performed.
     */
    summary: SummaryAPI;
    /**
     * The result list, sorted in descending order by score.
     */
    results: GeocodingResultAPI[];
};
