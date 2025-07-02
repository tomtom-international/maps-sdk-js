import type { AutocompleteSearchContext, AutocompleteSearchResult } from './autocompleteSearchResponse';
import type { LatLonAPI } from '../../shared/types/apiPlacesResponseTypes';

/**
 * @ignore
 */
export type AutocompleteSearchResponseAPI = {
    context: AutocompleteSearchContextAPI;
    results: AutocompleteSearchResult[];
};

/**
 * @ignore
 */
export type AutocompleteSearchContextAPI = Omit<AutocompleteSearchContext, 'geoBias'> & {
    geoBias?: AutocompleteSearchResultGeoBiasAPI;
};

/**
 * @ignore
 */
export type AutocompleteSearchResultGeoBiasAPI = {
    position?: LatLonAPI;
    radius?: number;
};
