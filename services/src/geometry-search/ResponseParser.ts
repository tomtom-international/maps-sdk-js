import { bboxFromPointFeatures, bboxOnlyIfWithArea, Place, toPointFeature } from "@anw/go-sdk-js/core";
import omit from "lodash/omit";

import { latLonAPIToPosition } from "../shared/Geometry";
import {
    GeometrySearchResponseAPI,
    GeometrySearchResponse,
    GeometrySearchResponseProps,
    GeometrySearchResultAPI
} from "./types";

const parseAPIResult = (result: GeometrySearchResultAPI): Place<GeometrySearchResponseProps> => {
    const { position, entryPoints, poi, ...rest } = result;
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        properties: {
            ...omit(rest, "viewport"),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            poi: {
                ...omit(poi, "categorySet"),
                brands: poi?.brands?.map((brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? []
            }
        }
    };
};

export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const features: Place<GeometrySearchResponseProps>[] = apiResponse.results.map((result) => parseAPIResult(result));
    const bbox = bboxOnlyIfWithArea(bboxFromPointFeatures(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
