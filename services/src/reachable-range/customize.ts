import { buildReachableRangeRequest } from './requestBuilder';
import { parseReachableRangeResponse } from './responseParser';
import { reachableRangeTemplate } from './reachableRangeTemplate';

const customize = {
    buildReachableRangeRequest,
    parseReachableRangeResponse,
    reachableRangeTemplate,
};
export default customize;
