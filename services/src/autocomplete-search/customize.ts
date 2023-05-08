import { autocompleteSearch } from "./autocompleteSearch";
import { buildAutocompleteSearchRequest } from "./requestBuilder";
import { parseAutocompleteSearchResponse } from "./responseParser";
import { autocompleteSearchTemplate } from "./autocompleteSearchTemplate";

const customize = {
    autocompleteSearch,
    buildAutocompleteSearchRequest,
    parseAutocompleteSearchResponse,
    autocompleteSearchTemplate
};
export default customize;
