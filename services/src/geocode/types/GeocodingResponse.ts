import { Places, PlaceType, SearchPlaceProps } from "@anw/maps-sdk-js/core";

type GeocodingPlaceType = Exclude<PlaceType, "POI">;

export type GeocodingProps = Omit<SearchPlaceProps, "info"> & {
    type: GeocodingPlaceType;
    /**
     * The confidence of the result`s textual match with the query.
     */
    matchConfidence: { score: number };
};

export type GeocodingResponse = Places<GeocodingProps>;
