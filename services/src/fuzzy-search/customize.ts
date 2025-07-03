import { fuzzySearch } from './fuzzySearch';
import { fuzzySearchTemplate } from './fuzzySearchTemplate';
import { buildFuzzySearchRequest } from './requestBuilder';
import { parseFuzzySearchResponse } from './responseParser';

const customize = {
    fuzzySearch,
    buildFuzzySearchRequest,
    parseFuzzySearchResponse,
    fuzzySearchTemplate,
};
export default customize;
