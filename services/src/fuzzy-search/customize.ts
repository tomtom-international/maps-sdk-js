import { fuzzySearch } from "./fuzzySearch";
import { buildFuzzySearchRequest } from "./requestBuilder";
import { parseFuzzySearchResponse } from "./responseParser";
import { fuzzySearchTemplate } from "./fuzzySearchTemplate";

const customize = {
    fuzzySearch,
    buildFuzzySearchRequest,
    parseFuzzySearchResponse,
    fuzzySearchTemplate
};
export default customize;
