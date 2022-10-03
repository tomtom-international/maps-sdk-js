import { bboxFromGeoJSONArray, bboxOnlyIfWithArea, Place } from "@anw/go-sdk-js/core";

import { GeometrySearchResponseAPI, GeometrySearchResponse, GeometrySearchResponseProps } from "./types";
import { parseAPIResultForGeometrySearchAndPlaceById } from "../shared/SearchResultParsing";

export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const features: Place<GeometrySearchResponseProps>[] = apiResponse.results.map((result) =>
        parseAPIResultForGeometrySearchAndPlaceById(result)
    );
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSONArray(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
