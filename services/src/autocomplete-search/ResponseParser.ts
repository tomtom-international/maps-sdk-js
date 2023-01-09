import { AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from "./types";
import { latLonAPIToPosition } from "../shared/Geometry";

/**
 * Default function to parse autocomplete response.
 * @group Autocomplete
 * @category Functions
 * @param apiResponse The API response.
 */
export const parseAutocompleteSearchResponse = (
    apiResponse: AutocompleteSearchResponseAPI
): AutocompleteSearchResponse => {
    const { position, ...geoBias } = apiResponse.context.geoBias || {};
    return {
        ...apiResponse,
        context: {
            ...apiResponse.context,
            geoBias: {
                ...(position && { position: latLonAPIToPosition(position) }),
                radiusMeters: geoBias.radius
            }
        }
    };
};
