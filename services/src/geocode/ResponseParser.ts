import { GeocodingAPIResponse, GeocodingParams, GeocodingResponse } from "./types";
import { toPointFeature } from "@anw/go-sdk-js/core";

export const parseGeocodingResponse = (
    _params: GeocodingParams,
    apiResponse: GeocodingAPIResponse
): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map((result) => ({
        ...toPointFeature([result.position.lon, result.position.lat]),
        properties: {
            ...result
        }
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
