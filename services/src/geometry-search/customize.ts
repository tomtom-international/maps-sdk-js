import { geometrySearch } from './geometrySearch';
import type { GeometrySearchTemplate } from './geometrySearchTemplate';
import { geometrySearchTemplate } from './geometrySearchTemplate';
import { buildGeometrySearchRequest } from './requestBuilder';
import { parseGeometrySearchResponse } from './responseParser';

const customize: {
    geometrySearch: typeof geometrySearch;
    buildGeometrySearchRequest: typeof buildGeometrySearchRequest;
    parseGeometrySearchResponse: typeof parseGeometrySearchResponse;
    geometrySearchTemplate: GeometrySearchTemplate;
} = {
    geometrySearch,
    buildGeometrySearchRequest,
    parseGeometrySearchResponse,
    geometrySearchTemplate,
};
export default customize;
