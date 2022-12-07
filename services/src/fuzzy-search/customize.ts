import { fuzzySearch } from "./FuzzySearch";
import { buildFuzzySearchRequest } from "./RequestBuilder";
import { parseFuzzySearchResponse } from "./ResponseParser";
import { fuzzySearchTemplate } from "./FuzzySearchTemplate";

const customize = {
    fuzzySearch,
    buildFuzzySearchRequest,
    parseFuzzySearchResponse,
    fuzzySearchTemplate
};
export default customize;
