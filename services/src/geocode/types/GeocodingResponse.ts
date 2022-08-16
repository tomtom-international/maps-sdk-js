import { FeatureCollection, Point, Polygon } from "geojson";
import { LocationType, Location } from "@anw/go-sdk-js/core";
import {
    Summary,
    LatLonAPI,
    ViewportAPI,
    BoundingBoxAPI,
    AddressRangesAPI,
    EntryPointAPI
} from "../../shared/types/APIResponseTypes";

type GeocodingLocationType = Exclude<LocationType, "POI">;

export type GeocodingResult = Location & {
    type: GeocodingLocationType;
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

export type GeocodingResponse = FeatureCollection<Point, GeocodingResult>;

type GeocodingResultAPI = Omit<
    GeocodingResult,
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
