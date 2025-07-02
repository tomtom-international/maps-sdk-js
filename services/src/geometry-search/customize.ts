import { geometrySearch } from './geometrySearch';
import { buildGeometrySearchRequest } from './requestBuilder';
import { parseGeometrySearchResponse } from './responseParser';
import { geometrySearchTemplate } from './geometrySearchTemplate';

const customize = {
    geometrySearch,
    buildGeometrySearchRequest,
    parseGeometrySearchResponse,
    geometrySearchTemplate,
};
export default customize;
