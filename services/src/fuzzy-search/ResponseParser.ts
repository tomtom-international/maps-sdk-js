import { bboxFromGeoJSON, bboxOnlyIfWithArea } from "@anw/go-sdk-js/core";

import { FuzzySearchResponse, FuzzySearchResponseAPI, QueryIntent, QueryIntentAPI } from "./types";
import { parseSearchAPIResult } from "../shared/SearchResultParsing";
import { latLonAPIToPosition } from "../shared/Geometry";

const queryIntentAPIToSDK = (intentAPI: QueryIntentAPI): QueryIntent => {
    let intent;
    switch (intentAPI.type) {
        case "COORDINATE":
            intent = { ...intentAPI, details: { position: latLonAPIToPosition(intentAPI.details) } };
            break;
        case "NEARBY":
            intent = {
                ...intentAPI,
                details: {
                    position: latLonAPIToPosition({ lon: intentAPI.details.lon, lat: intentAPI.details.lat }),
                    text: intentAPI.details.text,
                    query: intentAPI.details.query
                }
            };
            break;
        case "BOOKMARK":
        case "W3W":
            intent = intentAPI;
    }
    return intent;
};

/**
 * Default function to parse a fuzzy search response.
 * @param apiResponse The API response.
 */
export const parseFuzzySearchResponse = (apiResponse: FuzzySearchResponseAPI): FuzzySearchResponse => {
    const features = apiResponse.results.map(parseSearchAPIResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: "FeatureCollection",
        properties: {
            queryIntent: apiResponse.summary.queryIntent.map(queryIntentAPIToSDK),
            totalResults: apiResponse.summary.totalResults
        },
        features,
        ...(bbox && { bbox })
    };
};
