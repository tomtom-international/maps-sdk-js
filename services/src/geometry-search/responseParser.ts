import { bboxFromGeoJSON, bboxOnlyIfWithArea } from "@anw/maps-sdk-js/core";

import type { GeometrySearchResponse, GeometrySearchResponseAPI } from "./types";
import { parseSearchAPIResult, parseSummaryAPI } from "../shared/searchResultParsing";

/**
 * Default function to parse a geometry search response.
 * @param apiResponse The API response.
 */
export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
    const features = apiResponse.results.map(parseSearchAPIResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: "FeatureCollection",
        properties: {
            ...parseSummaryAPI(apiResponse.summary)
        },
        features,
        ...(bbox && { bbox })
    };
};
