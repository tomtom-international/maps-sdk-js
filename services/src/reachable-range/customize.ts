import type { ReachableRangeTemplate } from './reachableRangeTemplate';
import { reachableRangeTemplate } from './reachableRangeTemplate';
import { buildReachableRangeRequest } from './requestBuilder';
import { parseReachableRangeResponse } from './responseParser';

const customize: {
    buildReachableRangeRequest: typeof buildReachableRangeRequest;
    parseReachableRangeResponse: typeof parseReachableRangeResponse;
    reachableRangeTemplate: ReachableRangeTemplate;
} = {
    buildReachableRangeRequest,
    parseReachableRangeResponse,
    reachableRangeTemplate,
};
export default customize;
