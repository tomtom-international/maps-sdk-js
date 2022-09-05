import { LocationType, Locations, CommonLocationProps } from "@anw/go-sdk-js/core";

type GeocodingLocationType = Exclude<LocationType, "POI">;

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingProps = CommonLocationProps & {
    type: GeocodingLocationType;
    /**
     The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
};

/**
 * @group Geocoding
 * @category Types
 */
export type GeocodingResponse = Locations<GeocodingProps>;
