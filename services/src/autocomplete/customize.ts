import { autocomplete } from "./Autocomplete";
import { buildAutocompleteRequest } from "./RequestBuilder";
import { parseAutocompleteResponse } from "./ResponseParser";
import { autocompleteTemplate } from "./AutocompleteTemplate";

const customize = {
    autocomplete,
    buildAutocompleteRequest,
    parseAutocompleteResponse,
    autocompleteTemplate
};
export default customize;
