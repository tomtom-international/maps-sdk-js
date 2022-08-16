import { GeocodingResponseAPI, GeocodingResponse } from "./types/GeocodingResponse";
import { GeocodingParams } from "./types/GeocodingParams";
import { GeographyType, toPointFeature } from "@anw/go-sdk-js/core";
import { bboxToPolygon, LatLonAPIToPosition } from "../shared/Geometry";

export const parseGeocodingResponse = (
    __params: GeocodingParams,
    apiResponse: GeocodingResponseAPI
): GeocodingResponse => {
    const results = apiResponse.results;
    const features = results.map(({ boundingBox, viewport, entryPoints, addressRanges, entityType, ...result }) => ({
        ...toPointFeature(LatLonAPIToPosition(result.position)),
        properties: {
            ...result,
            ...(result.position && { position: [result.position.lon, result.position.lat] }),
            ...(result.dist && { distance: result.dist }),
            ...(boundingBox && { boundingBox: bboxToPolygon(boundingBox) }),
            ...(viewport && { viewport: bboxToPolygon(viewport) }),
            ...(entityType && { geographyType: entityType.split(",") as GeographyType[] }),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: LatLonAPIToPosition(entrypoint.position)
                }))
            }),
            ...(addressRanges && {
                addressRanges: {
                    ...addressRanges,
                    from: LatLonAPIToPosition(addressRanges.from),
                    to: LatLonAPIToPosition(addressRanges.to)
                }
            })
        }
    }));
    return {
        type: "FeatureCollection",
        features
    };
};
