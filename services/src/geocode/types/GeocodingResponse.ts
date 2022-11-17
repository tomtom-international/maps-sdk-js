import { Places, PlaceType, SearchPlaceProps } from "@anw/go-sdk-js/core";

type GeocodingPlaceType = Exclude<PlaceType, "POI">;

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingProps = Omit<SearchPlaceProps, "info"> & {
    type: GeocodingPlaceType;
    /**
     * The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
};

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingResponse = Places<GeocodingProps>;
