import { reachableRangeTemplate } from './reachableRangeTemplate';
import { buildReachableRangeRequest } from './requestBuilder';
import { parseReachableRangeResponse } from './responseParser';

const customize = {
    buildReachableRangeRequest,
    parseReachableRangeResponse,
    reachableRangeTemplate,
};
export default customize;
