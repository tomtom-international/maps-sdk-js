import { bboxFromGeoJSON, bboxOnlyIfWithArea } from "@anw/go-sdk-js/core";

import { GeometrySearchResponse, GeometrySearchResponseAPI } from "./types";
import { parseSearchAPIResult } from "../shared/SearchResultParsing";

/**
 * Default function to parse a geometry search response.
 * @group Geometry Search
 * @category Functions
 * @param apiResponse The API response.
 */
export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const features = apiResponse.results.map(parseSearchAPIResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: "FeatureCollection",
        features,
        ...(bbox && { bbox })
    };
};
