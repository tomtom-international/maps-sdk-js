import { autocompleteSearch } from './autocompleteSearch';
import { autocompleteSearchTemplate } from './autocompleteSearchTemplate';
import { buildAutocompleteSearchRequest } from './requestBuilder';
import { parseAutocompleteSearchResponse } from './responseParser';

const customize = {
    autocompleteSearch,
    buildAutocompleteSearchRequest,
    parseAutocompleteSearchResponse,
    autocompleteSearchTemplate,
};
export default customize;
