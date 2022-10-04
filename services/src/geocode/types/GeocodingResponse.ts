import { CommonPlaceProps, Places, PlaceType } from "@anw/go-sdk-js/core";

type GeocodingPlaceType = Exclude<PlaceType, "POI">;

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingProps = CommonPlaceProps & {
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
