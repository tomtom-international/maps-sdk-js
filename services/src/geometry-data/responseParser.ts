import type { PolygonFeatures } from '@anw/maps-sdk-js/core';
import { bboxFromGeoJSON } from '@anw/maps-sdk-js/core';
import type { GeometryDataResponseAPI } from './types/apiTypes';

/**
 * Default geometry data API response parsing.
 * * The API response consists of an array, with a FeatureCollection (with only one feature) for each geometry.
 * * The parsed response consists of a fully-GeoJSON-compatible FeatureCollection with a Feature for each geometry.
 * * Each geometry ID is included in each GeoJSON feature "id" field.
 * @param apiResponse
 */
export const parseGeometryDataResponse = (apiResponse: GeometryDataResponseAPI): PolygonFeatures => {
    const features = apiResponse.additionalData
        .flatMap((data) =>
            (data.geometryData as PolygonFeatures)?.features.map((feature) => ({
                ...feature,
                bbox: bboxFromGeoJSON(feature.geometry),
            })),
        )
        .filter((feature) => feature);
    return {
        type: 'FeatureCollection',
        bbox: bboxFromGeoJSON(features),
        features,
    };
};
