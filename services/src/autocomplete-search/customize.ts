import { autocompleteSearch } from "./AutocompleteSearch";
import { buildAutocompleteSearchRequest } from "./RequestBuilder";
import { parseAutocompleteSearchResponse } from "./ResponseParser";
import { autocompleteSearchTemplate } from "./AutocompleteSearchTemplate";

const customize = {
    autocompleteSearch,
    buildAutocompleteSearchRequest,
    parseAutocompleteSearchResponse,
    autocompleteSearchTemplate
};
export default customize;
