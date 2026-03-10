import { poiIDsToCategories } from '@tomtom-org/maps-sdk/core';
import { latLonAPIToPosition } from '../shared/geometry';
import type {
    AutocompleteSearchCategorySegmentAPI,
    AutocompleteSearchResponse,
    AutocompleteSearchResponseAPI,
    AutocompleteSearchResultAPI,
} from './types';

const isCategorySegment = (
    segment: AutocompleteSearchResultAPI['segments'][number],
): segment is AutocompleteSearchCategorySegmentAPI => segment.type === 'category';

const parseResults = (results: AutocompleteSearchResultAPI[]): AutocompleteSearchResponse['results'] =>
    results.map((result) => ({
        segments: result.segments.map((segment) => {
            if (isCategorySegment(segment)) {
                const { id, ...rest } = segment;
                return { ...rest, category: poiIDsToCategories[Number(id)] };
            }
            return segment;
        }),
    }));

/**
 * Default function to parse autocomplete response.
 * @param apiResponse The API response.
 */
export const parseAutocompleteSearchResponse = (
    apiResponse: AutocompleteSearchResponseAPI,
): AutocompleteSearchResponse => {
    const { position, ...geoBias } = apiResponse.context.geoBias || {};
    return {
        context: {
            ...apiResponse.context,
            geoBias: {
                ...(position && { position: latLonAPIToPosition(position) }),
                radiusMeters: geoBias.radius,
            },
        },
        results: parseResults(apiResponse.results),
    };
};
