import { LocationType, Locations, CommonLocationProps } from "@anw/go-sdk-js/core";

type GeocodingLocationType = Exclude<LocationType, "POI">;

export type GeocodingProps = CommonLocationProps & {
    type: GeocodingLocationType;
    /**
     The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
};

export type GeocodingResponse = Locations<GeocodingProps>;
