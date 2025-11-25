import { describe, expect, test } from 'vitest';
import { parseCalculateMatrixRouteResponse } from '../responseParser';
import apiAndParsedResponses from './responseParser.data';

describe('Matrix Route response parsing tests', () => {
    // Functional tests:
    test.each(apiAndParsedResponses)("'%s'", (_name, apiResponse, parsedResponse) => {
        // @ts-ignore
        expect(parseCalculateMatrixRouteResponse(apiResponse)).toEqual(parsedResponse);
    });
});
