import { bboxFromGeoJSON, bboxOnlyIfWithArea } from "@anw/go-sdk-js/core";

import { FuzzySearchResponse, FuzzySearchResponseAPI } from "./types";
import { parseSearchAPIResult } from "../shared/SearchResultParsing";

/**
 * Default function to parse a fuzzy search response.
 * @group Fuzzy Search
 * @category Functions
 * @param apiResponse The API response.
 */
export const parseFuzzySearchResponse = (apiResponse: FuzzySearchResponseAPI): FuzzySearchResponse => {
    const features = apiResponse.results.map((result) => parseSearchAPIResult(result));
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: "FeatureCollection",
        properties: {
            queryIntent: apiResponse.summary.queryIntent,
            numResults: apiResponse.summary.numResults,
            totalResults: apiResponse.summary.totalResults
        },
        features,
        ...(bbox && { bbox })
    };
};
