import { sdkAndAPIRequests } from "./requestBuilder.data";
import { routeRequestParams, shortRouteRequestParams } from "./requestBuilderPerf.data";
import { CalculateRouteParams } from "../types/calculateRouteParams";
import { buildCalculateRouteRequest } from "../requestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";
import { FetchInput } from "../../shared/types/fetch";
import { CalculateRoutePOSTDataAPI } from "../types/apiRequestTypes";

describe("Calculate Route request building functional tests", () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (_name: string, params: CalculateRouteParams, apiRequest: FetchInput<CalculateRoutePOSTDataAPI>) => {
            expect(buildCalculateRouteRequest(params)).toEqual(apiRequest);
        }
    );
});

describe("Calculate Route request building performance tests", () => {
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(shortRouteRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding
        );

        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(routeRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding
        );
    });
});
