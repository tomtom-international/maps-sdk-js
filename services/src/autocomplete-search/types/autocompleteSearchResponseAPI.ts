import type { LatLonAPI } from '../../shared/types/apiPlacesResponseTypes';
import type {
    AutocompleteGenericSearchSegment,
    AutocompleteSearchBrandSegment,
    AutocompleteSearchContext,
    AutocompleteSearchPlaintextSegment,
} from './autocompleteSearchResponse';

/**
 * @ignore
 */
export type AutocompleteSearchCategorySegmentAPI = AutocompleteGenericSearchSegment & {
    type: 'category';
    id: string;
    matchedAlternativeName?: string;
};

/**
 * @ignore
 */
export type AutocompleteSearchSegmentAPI =
    | AutocompleteSearchBrandSegment
    | AutocompleteSearchCategorySegmentAPI
    | AutocompleteSearchPlaintextSegment;

/**
 * @ignore
 */
export type AutocompleteSearchResultAPI = {
    segments: AutocompleteSearchSegmentAPI[];
};

/**
 * @ignore
 */
export type AutocompleteSearchResponseAPI = {
    context: AutocompleteSearchContextAPI;
    results: AutocompleteSearchResultAPI[];
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
