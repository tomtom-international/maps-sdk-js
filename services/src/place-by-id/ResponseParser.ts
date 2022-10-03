import { bboxFromGeoJSONArray, bboxOnlyIfWithArea, Place, toPointFeature } from "@anw/go-sdk-js/core";
import omit from "lodash/omit";

import { latLonAPIToPosition } from "../shared/Geometry";
import { PlaceByIdResponseAPI, PlaceByIdResultAPI, PlaceByIdResponse, PlaceByIdResponseProps } from "./types";

const parseAPIResult = (result: PlaceByIdResultAPI): Place<PlaceByIdResponseProps> => {
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

export const parsePlaceByIdResponse = (apiResponse: PlaceByIdResponseAPI): PlaceByIdResponse => {
    const features: Place<PlaceByIdResponseProps>[] = apiResponse.results.map((result) => parseAPIResult(result));
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSONArray(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
