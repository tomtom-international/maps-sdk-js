import type { Routes } from '@cet/maps-sdk-js/core';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { describe, expect, test } from 'vitest';
import type { SDKServiceError } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import type { APIErrorResponse, RoutingAPIResponseError } from '../../shared/types/apiResponseErrorTypes';
import type { CalculateRouteParams } from '..';
import { parseCalculateRouteResponse } from '../responseParser';
import { parseRoutingResponseError } from '../routingResponseErrorParser';
import type { CalculateRouteResponseAPI } from '../types/apiResponseTypes';
import apiAndParsedResponses from './responseParser.data.json';
import errorResponses from './responseParserError.data.json';
import longApiResponse from './responseParserPerf.data.json';

describe('Calculate Route response parsing functional tests', () => {
    // Functional tests:
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (
            _name: string,
            apiResponse: CalculateRouteResponseAPI,
            params: CalculateRouteParams,
            parsedResponse: Routes,
        ) => {
            // (We use JSON.stringify because of the relation between JSON inputs and Date objects)
            // (We reparse the objects to compare them ignoring the order of properties)
            expect(JSON.parse(JSON.stringify(parseCalculateRouteResponse(apiResponse)))).toMatchObject(
                JSON.parse(JSON.stringify(parsedResponse)),
            );
        },
    );
});

describe('Calculate Route response parsing performance tests', () => {
    test(
        'Parsing a very long API response ' + '(e.g. Lisbon - Moscow with sections, instructions and alternatives)',
        () => {
            expect(
                bestExecutionTimeMS(
                    () => parseCalculateRouteResponse(longApiResponse as CalculateRouteResponseAPI /*, {} as never*/),
                    20,
                ),
            ).toBeLessThan(MAX_EXEC_TIMES_MS.routing.responseParsing);
        },
    );
});

describe('Routing - error response parsing tests', () => {
    test.each(errorResponses)(
        "'%s'",
        // @ts-ignore
        async (
            _name: string,
            apiResponseError: APIErrorResponse<RoutingAPIResponseError>,
            expectedSdkError: SDKServiceError,
        ) => {
            const sdkRoutingResponseError = parseRoutingResponseError(apiResponseError, 'Routing');
            expect(sdkRoutingResponseError).toMatchObject(expectedSdkError);
        },
    );
});

describe('Routing - no section from api response', () => {
    test('Route with undefined api sections', async () => {
        const apiRoute = apiAndParsedResponses[0][1] as unknown as CalculateRouteResponseAPI;

        for (const route of apiRoute.routes) {
            if (route.sections) {
                // @ts-ignore
                route.sections = undefined;
            }
        }

        expect(() => parseCalculateRouteResponse(apiRoute /*, {} as never*/)).not.toThrow();
    });
});
