import { bboxFromGeoJSON, bboxOnlyIfWithArea } from '@tomtom-org/maps-sdk-js/core';
import { latLonAPIToPosition } from '../shared/geometry';
import { parseSearchAPIResult, parseSummaryAPI } from '../shared/searchResultParsing';
import type { FuzzySearchResponse, FuzzySearchResponseAPI, QueryIntent, QueryIntentAPI } from './types';

const queryIntentApiToSdk = (intentApi: QueryIntentAPI): QueryIntent => {
    let intent;
    switch (intentApi.type) {
        case 'COORDINATE':
            intent = { ...intentApi, details: { position: latLonAPIToPosition(intentApi.details) } };
            break;
        case 'NEARBY':
            intent = {
                ...intentApi,
                details: {
                    position: latLonAPIToPosition({ lon: intentApi.details.lon, lat: intentApi.details.lat }),
                    text: intentApi.details.text,
                    query: intentApi.details.query,
                },
            };
            break;
        case 'BOOKMARK':
        case 'W3W':
            intent = intentApi;
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
        type: 'FeatureCollection',
        properties: {
            ...parseSummaryAPI(apiResponse.summary),
            queryIntent: apiResponse.summary.queryIntent.map(queryIntentApiToSdk),
        },
        features,
        ...(bbox && { bbox }),
    };
};
