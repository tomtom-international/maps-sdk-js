import { bboxFromGeoJSON, bboxOnlyIfWithArea } from '@anw/maps-sdk-js/core';
import { parseSearchAPIResult, parseSummaryAPI } from '../shared/searchResultParsing';
import type { GeometrySearchResponse, GeometrySearchResponseAPI } from './types';

/**
 * Default function to parse a geometry search response.
 * @param apiResponse The API response.
 */
export const parseGeometrySearchResponse = (apiResponse: GeometrySearchResponseAPI): GeometrySearchResponse => {
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
