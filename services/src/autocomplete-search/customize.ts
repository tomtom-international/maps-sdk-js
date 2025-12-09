import { autocompleteSearch } from './autocompleteSearch';
import type { AutocompleteSearchTemplate } from './autocompleteSearchTemplate';
import { autocompleteSearchTemplate } from './autocompleteSearchTemplate';
import { buildAutocompleteSearchRequest } from './requestBuilder';
import { parseAutocompleteSearchResponse } from './responseParser';

const customize: {
    autocompleteSearch: typeof autocompleteSearch;
    buildAutocompleteSearchRequest: typeof buildAutocompleteSearchRequest;
    parseAutocompleteSearchResponse: typeof parseAutocompleteSearchResponse;
    autocompleteSearchTemplate: AutocompleteSearchTemplate;
} = {
    autocompleteSearch,
    buildAutocompleteSearchRequest,
    parseAutocompleteSearchResponse,
    autocompleteSearchTemplate,
};
export default customize;
