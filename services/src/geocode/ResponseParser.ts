import { GeocodingResponseAPI, GeocodingResponse } from "./types/GeocodingResponse";
import { GeocodingParams } from "./types/GeocodingParams";
import { toPointFeature } from "@anw/go-sdk-js/core";
import { bboxToPolygon, LatLonAPIToPosition } from "../shared/Geometry";

export const parseGeocodingResponse = (
    __params: GeocodingParams,
    apiResponse: GeocodingResponseAPI
): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map(({ boundingBox, ...result }) => ({
        ...toPointFeature(LatLonAPIToPosition(result.position)),
        properties: {
            ...result,
            ...(result.position && { position: [result.position.lon, result.position.lat] }),
            ...(result.dist && { distance: result.dist }),
            ...(boundingBox && { boundingBox: bboxToPolygon(boundingBox) }),
            ...(result.viewport && { viewport: bboxToPolygon(result.viewport) }),
            ...(result.entityType && { geographyType: result.entityType }),
            ...(result.entrypoints && {
                entrypoints: result.entrypoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: LatLonAPIToPosition(entrypoint.position)
                }))
            }),
            ...(result.addressRanges && {
                addressRanges: {
                    ...result.addressRanges,
                    from: LatLonAPIToPosition(result.addressRanges.from),
                    to: LatLonAPIToPosition(result.addressRanges.to)
                }
            })
        }
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
