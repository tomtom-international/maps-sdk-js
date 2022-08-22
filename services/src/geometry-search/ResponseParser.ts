import { toPointFeature, Location } from "@anw/go-sdk-js/core";
import omit from "lodash/omit";

import { bboxToPolygon, latLonAPIToPosition } from "../shared/Geometry";
import { GeometrySearchResponseAPI, GeometrySearchResponse, GeometrySearchResponseProps } from "./types";

export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const results = apiResponse.results;

    const features: Location<GeometrySearchResponseProps>[] = results.map((result) => ({
        ...toPointFeature(latLonAPIToPosition(result.position)),
        properties: {
            ...omit(result, "poi"),
            ...(result.position && { position: [result.position.lon, result.position.lat] }),
            viewport: result.viewport ? bboxToPolygon(result.viewport) : undefined,
            entryPoints: result.entryPoints
                ? result.entryPoints.map((entrypoint) => ({
                      ...entrypoint,
                      position: latLonAPIToPosition(entrypoint.position)
                  }))
                : undefined,
            poi: {
                ...omit(result.poi, "categorySet"),
                brands: result.poi?.brands?.map((brand) => brand.name) ?? [],
                categoryIds: result.poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    }));

    return {
        type: "FeatureCollection",
        features
    };
};
