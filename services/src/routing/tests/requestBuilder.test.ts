import { sdkAndAPIRequests } from "./requestBuilder.data";
import { shortRouteRequestParams } from "./requestBuilderPerf.data";
import { CalculateRouteParams } from "../types/calculateRouteParams";
import { buildCalculateRouteRequest } from "../requestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";
import { FetchInput } from "../../shared/types/fetch";
import { CalculateRoutePOSTDataAPI } from "../types/apiPostRequestTypes";

describe("Calculate Route request URL building functional tests", () => {
    test.each(sdkAndAPIRequests)(
        "'%s'",
        (_name: string, params: CalculateRouteParams, fetchInput: FetchInput<CalculateRoutePOSTDataAPI>) => {
            expect(buildCalculateRouteRequest(params)).toStrictEqual(fetchInput);
        }
    );
});

describe("Calculate Route request URL building performance tests", () => {
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(bestExecutionTimeMS(() => buildCalculateRouteRequest(shortRouteRequestParams), 20)).toBeLessThan(
            MAX_EXEC_TIMES_MS.routing.requestBuilding
        );
    });
});
