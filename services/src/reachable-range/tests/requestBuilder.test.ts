import { buildReachableRangeRequest } from '../requestBuilder';
import type { ReachableRangeParams } from '../types/reachableRangeParams';
import { sdkAndAPIRequests } from './requestBuilder.data';

describe.skip('Reachable range request URL building functional tests', () => {
    test.each(sdkAndAPIRequests)("'%s'", (_name: string, params: ReachableRangeParams, apiRequest: URL) => {
        expect(buildReachableRangeRequest(params)).toEqual(apiRequest);
    });
});
