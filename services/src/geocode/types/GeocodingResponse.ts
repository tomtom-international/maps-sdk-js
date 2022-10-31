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
    /**
     * The score of the result.
     * A larger score means there is a probability that a result meeting the query criteria is higher.
     */
    score?: number;
    /**
     * Unit: meters. This is the distance to an object if geobias was provided.
     */
    distance?: number;
};

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingResponse = Places<GeocodingProps>;
