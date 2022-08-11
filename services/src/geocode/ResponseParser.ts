import { GeocodingAPIResponse, GeocodingParams, GeocodingResponse } from "./types";
import { toPointFeature } from "@anw/go-sdk-js/core";
import { bboxToPolygon } from "../shared/Geometry";

export const parseGeocodingResponse = (
    __params: GeocodingParams,
    apiResponse: GeocodingAPIResponse
): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map(({ boundingBox, ...result }) => ({
        ...toPointFeature([result.position.lon, result.position.lat]),
        properties: {
            ...result,
            ...(result.position && { position: [result.position.lon, result.position.lat] }),
            ...(result.dist && { distance: result.dist }),
            ...(boundingBox && { boundingBox: bboxToPolygon(boundingBox) }),
            ...(result.viewport && { viewport: bboxToPolygon(result.viewport) })
        }
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
