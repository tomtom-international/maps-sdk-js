import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseAutocompleteSearchResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';
import apiResponses from './responseParserPerf.data';

describe('Autocomplete response parser tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, parsedResponse) => {
        expect(parseAutocompleteSearchResponse(apiResponse)).toStrictEqual(parsedResponse);
    });
});

describe('Autocomplete response parser performance tests', () => {
    test.each(apiResponses)("'%s'", (_title, apiResponse) => {
        expect(bestExecutionTimeMS(() => parseAutocompleteSearchResponse(apiResponse), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.autocomplete.responseParsing,
        );
    });
});
