import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { parseRevGeoResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';
import apiResponses from './responseParserPerf.data';

describe('ReverseGeocode response parsing tests', () => {
    test.each(apiAndParsedResponses)("'%s'", (_name, params, apiResponse, expectedParsedResponse) => {
        expect(parseRevGeoResponse(apiResponse, params)).toMatchObject(expectedParsedResponse);
    });
});

describe('ReverseGeocode response parsing performance tests', () => {
    test.each(apiResponses)("'%s'", (_title, params, apiResponse) => {
        expect(bestExecutionTimeMS(() => parseRevGeoResponse(apiResponse, params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.revGeo.responseParsing,
        );
    });
});
