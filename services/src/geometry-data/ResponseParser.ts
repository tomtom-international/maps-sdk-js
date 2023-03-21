import { bboxFromGeoJSON, GeometryDataResponse } from "@anw/maps-sdk-js/core";
import { GeometryDataResponseAPI } from "./types/APITypes";

/**
 * Default geometry data API response parsing.
 * * The API response consists of an array, with a FeatureCollection (with only one feature) for each geometry.
 * * The parsed response consists of a fully-GeoJSON-compatible FeatureCollection with a Feature for each geometry.
 * * Each geometry ID is included in each GeoJSON feature "id" field.
 * @param apiResponse
 */
export const parseGeometryDataResponse = (apiResponse: GeometryDataResponseAPI): GeometryDataResponse => {
    const features = apiResponse.additionalData
        .flatMap((data) =>
            (data.geometryData as GeometryDataResponse)?.features.map((feature) => ({
                ...feature,
                bbox: bboxFromGeoJSON(feature.geometry)
            }))
        )
        .filter((feature) => feature);
    return {
        type: "FeatureCollection",
        bbox: bboxFromGeoJSON(features),
        features
    };
};
