import { fuzzySearch } from './fuzzySearch';
import type { FuzzySearchTemplate } from './fuzzySearchTemplate';
import { fuzzySearchTemplate } from './fuzzySearchTemplate';
import { buildFuzzySearchRequest } from './requestBuilder';
import { parseFuzzySearchResponse } from './responseParser';

const customize: {
    fuzzySearch: typeof fuzzySearch;
    buildFuzzySearchRequest: typeof buildFuzzySearchRequest;
    parseFuzzySearchResponse: typeof parseFuzzySearchResponse;
    fuzzySearchTemplate: FuzzySearchTemplate;
} = {
    fuzzySearch,
    buildFuzzySearchRequest,
    parseFuzzySearchResponse,
    fuzzySearchTemplate,
};
export default customize;
