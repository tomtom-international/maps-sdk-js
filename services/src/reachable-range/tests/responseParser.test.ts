import { describe, expect, test } from 'vitest';
import { parseReachableRangeResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';

describe.skip('Calculate Route response parsing functional tests', () => {
    // Functional tests:
    // @ts-ignore - test.each has tuple type inference limitations
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, params, parsedResponse) => {
        // @ts-ignore
        expect(parseReachableRangeResponse(apiResponse, params)).toEqual(parsedResponse);
    });
});
