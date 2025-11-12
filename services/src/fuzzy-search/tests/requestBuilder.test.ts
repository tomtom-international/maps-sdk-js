import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildFuzzySearchRequest } from '../requestBuilder';
import type { FuzzySearchParams } from '../types';
import fuzzySearchReqObjectsAndUrLs from './requestBuilder.data.json';
import fuzzySearchReqObjects from './requestBuilderPerf.data.json';

describe('Calculate Fuzzy Search request URL building tests', () => {
    test.each(fuzzySearchReqObjectsAndUrLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: FuzzySearchParams, requestUrl: string) => {
            expect(buildFuzzySearchRequest(params).toString()).toStrictEqual(requestUrl);
        },
    );
});

describe('Fuzzy Search request URL builder performance tests', () => {
    test('Fuzzy Search request URL builder tests', async () => {
        expect(
            bestExecutionTimeMS(() => buildFuzzySearchRequest(fuzzySearchReqObjects as FuzzySearchParams), 10),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.fuzzySearch.requestBuilding);
    });
});
