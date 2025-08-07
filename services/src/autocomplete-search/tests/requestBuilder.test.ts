import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { describe, expect, test } from 'vitest';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildAutocompleteSearchRequest } from '../requestBuilder';
import type { AutocompleteSearchParams } from '../types';
import autocompleteSearchReqObjectsAndUrLs from './requestBuilder.data.json';
import autocompleteSearchReqObjects from './requestBuilderPerf.data.json';

describe('Autocomplete Search request URL building tests', () => {
    test.each(autocompleteSearchReqObjectsAndUrLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: AutocompleteSearchParams, requestUrl: string) => {
            expect(buildAutocompleteSearchRequest(params).toString()).toStrictEqual(requestUrl);
        },
    );
});

describe('Autocomplete request URL builder performance tests', () => {
    test.each(autocompleteSearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: AutocompleteSearchParams) => {
            expect(bestExecutionTimeMS(() => buildAutocompleteSearchRequest(params), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.autocomplete.requestBuilding,
            );
        },
    );
});
