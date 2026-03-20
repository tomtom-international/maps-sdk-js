import { describe, expect, test } from 'vitest';
import type { FetchInput } from '../../shared';
import { buildReachableRangeRequest } from '../requestBuilder';
import type { ReachableRangeParams } from '../types/reachableRangeParams';
import { sdkAndAPIRequests } from './requestBuilder.data';

describe('Reachable range request URL building functional tests', () => {
    test.each(sdkAndAPIRequests)("'%s'", (_name: string, params: ReachableRangeParams, apiRequest: FetchInput) => {
        expect(buildReachableRangeRequest(params)).toEqual(apiRequest);
    });
});
