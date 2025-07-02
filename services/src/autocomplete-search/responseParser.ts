import type { AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from './types';
import { latLonAPIToPosition } from '../shared/geometry';

/**
 * Default function to parse autocomplete response.
 * @param apiResponse The API response.
 */
export const parseAutocompleteSearchResponse = (
    apiResponse: AutocompleteSearchResponseAPI,
): AutocompleteSearchResponse => {
    const { position, ...geoBias } = apiResponse.context.geoBias || {};
    return {
        ...apiResponse,
        context: {
            ...apiResponse.context,
            geoBias: {
                ...(position && { position: latLonAPIToPosition(position) }),
                radiusMeters: geoBias.radius,
            },
        },
    };
};
