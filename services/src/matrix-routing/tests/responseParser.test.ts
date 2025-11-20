import { describe, expect, test } from 'vitest';
import { parseCalculateMatrixRouteResponse } from '../responseParser';
import type { CalculateMatrixRouteResponseAPI } from '../types/apiResponseTypes';
import apiAndParsedResponses from './responseParser.data.json';

describe('Matrix Route response parsing tests', () => {
    // Functional tests:
    test.each(
        apiAndParsedResponses,
    )("'%s'", (_name: string, apiResponse: CalculateMatrixRouteResponseAPI, parsedResponse: CalculateMatrixRouteResponseAPI) => {
        // @ts-ignore
        expect(parseCalculateMatrixRouteResponse(apiResponse)).toEqual(parsedResponse);
    });
});
