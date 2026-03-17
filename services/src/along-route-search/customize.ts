import { alongRouteSearch } from './alongRouteSearch';
import type { AlongRouteSearchTemplate } from './alongRouteSearchTemplate';
import { alongRouteSearchTemplate } from './alongRouteSearchTemplate';
import { buildAlongRouteSearchRequest } from './requestBuilder';
import { parseAlongRouteSearchResponse } from './responseParser';

const customize: {
    alongRouteSearch: typeof alongRouteSearch;
    buildAlongRouteSearchRequest: typeof buildAlongRouteSearchRequest;
    parseAlongRouteSearchResponse: typeof parseAlongRouteSearchResponse;
    alongRouteSearchTemplate: AlongRouteSearchTemplate;
} = {
    alongRouteSearch,
    buildAlongRouteSearchRequest,
    parseAlongRouteSearchResponse,
    alongRouteSearchTemplate,
};
export default customize;
