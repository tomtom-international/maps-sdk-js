import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildAutocompleteSearchRequest } from '../requestBuilder';
import autocompleteSearchReqObjectsAndUrLs from './requestBuilder.data';
import autocompleteSearchReqObjects from './requestBuilderPerf.data';

describe('Autocomplete Search request URL building tests', () => {
    // @ts-ignore - test.each has tuple type inference limitations
    test.each(autocompleteSearchReqObjectsAndUrLs)("'%s'", (_name, params, requestUrl) => {
        // @ts-ignore
        expect(buildAutocompleteSearchRequest(params).toString()).toStrictEqual(requestUrl);
    });
});

describe('Autocomplete request URL builder performance tests', () => {
    // @ts-ignore - test.each has tuple type inference limitations
    test.each(autocompleteSearchReqObjects)("'%s'", (_title, params) => {
        // @ts-ignore
        expect(bestExecutionTimeMS(() => buildAutocompleteSearchRequest(params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.autocomplete.requestBuilding,
        );
    });
});
