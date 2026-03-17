import { bboxFromGeoJSON, bboxOnlyIfWithArea } from '@tomtom-org/maps-sdk/core';
import { parseSearchAPIResult, parseSummaryAPI } from '../shared/searchResultParsing';
import type { AlongRouteSearchResponse, AlongRouteSearchResponseAPI } from './types';

/**
 * Default function to parse an along-route search response.
 * @param apiResponse The API response.
 */
export const parseAlongRouteSearchResponse = (apiResponse: AlongRouteSearchResponseAPI): AlongRouteSearchResponse => {
    const features = apiResponse.results.map(parseSearchAPIResult);
    const bbox = bboxOnlyIfWithArea(bboxFromGeoJSON(features));
    return {
        type: 'FeatureCollection',
        properties: {
            ...parseSummaryAPI(apiResponse.summary),
        },
        features,
        ...(bbox && { bbox }),
    };
};
