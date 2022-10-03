import { bboxFromGeoJSONArray, bboxOnlyIfWithArea, Place } from "@anw/go-sdk-js/core";

import { PlaceByIdResponseAPI, PlaceByIdResponse, PlaceByIdResponseProps } from "./types";
import { parseAPIResultForGeometrySearchAndPlaceById } from "../shared/SearchResultParsing";

export const parsePlaceByIdResponse = (apiResponse: PlaceByIdResponseAPI): PlaceByIdResponse => {
    const features: Place<PlaceByIdResponseProps>[] = apiResponse.results.map((result) =>
        parseAPIResultForGeometrySearchAndPlaceById(result)
    );
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSONArray(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
