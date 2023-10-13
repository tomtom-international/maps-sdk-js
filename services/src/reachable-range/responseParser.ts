import { Polygon } from "geojson";
import { ReachableRangeResponseAPI } from "./types/apiResponseTypes";
import { bboxFromGeoJSON, PolygonFeature } from "@anw/maps-sdk-js/core";
import { ReachableRangeParams } from "./types/reachableRangeParams";

/**
 *
 * @param apiResponse
 * @param params
 */
export const parseReachableRangeResponse = (
    apiResponse: ReachableRangeResponseAPI,
    params: ReachableRangeParams
): PolygonFeature<ReachableRangeParams> => {
    const geometry: Polygon = {
        type: "Polygon",
        coordinates: [apiResponse.reachableRange.boundary.map((point) => [point.longitude, point.latitude])]
    };
    const bbox = bboxFromGeoJSON(geometry);
    return { type: "Feature", geometry, bbox, properties: params };
};
