import { bboxFromPointFeatures, bboxOnlyIfWithArea, Place, toPointFeature } from "@anw/go-sdk-js/core";
import omit from "lodash/omit";

import { bboxToPolygon, latLonAPIToPosition } from "../shared/Geometry";
import { GeometrySearchResponseAPI, GeometrySearchResponse, GeometrySearchResponseProps } from "./types";

export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const results = apiResponse.results;

    const features: Place<GeometrySearchResponseProps>[] = results.map((result) => ({
        ...toPointFeature(latLonAPIToPosition(result.position)),
        properties: {
            ...omit(result, "position", "poi", "viewport", "entryPoints"),
            ...(result.viewport && { viewport: bboxToPolygon(result.viewport) }),
            ...(result.entryPoints && {
                entryPoints: result.entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            poi: {
                ...omit(result.poi, "categorySet"),
                brands: result.poi?.brands?.map((brand) => brand.name) ?? [],
                categoryIds: result.poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    }));

    const bbox = bboxOnlyIfWithArea(bboxFromPointFeatures(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
