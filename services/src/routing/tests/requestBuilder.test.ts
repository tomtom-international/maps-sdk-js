import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import type { FetchInput } from '../../shared';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildCalculateRouteRequest } from '../requestBuilder';
import type { CalculateRoutePOSTDataAPI } from '../types/apiRequestTypes';
import type { CalculateRouteParams } from '../types/calculateRouteParams';
import { sdkAndAPIRequests } from './requestBuilder.data';
import { routeRequestParams, shortRouteRequestParams } from './requestBuilderPerf.data';

describe('Calculate Route request building functional tests', () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (_name: string, params: CalculateRouteParams, apiRequest: FetchInput<CalculateRoutePOSTDataAPI>) => {
            // we reparse the objects to compare URL objects properly:
            expect(JSON.parse(JSON.stringify(buildCalculateRouteRequest(params)))).toEqual(
                JSON.parse(JSON.stringify(apiRequest)),
            );
        },
    );
});

describe('Calculate Route request building performance tests', () => {
    test('Calculate route request with many waypoints, mandatory & optional params', () => {
        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(shortRouteRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding,
        );

        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(routeRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding,
        );
    });
});
