import { requestObjectsAndURLs } from "./RequestBuilder.data";
import { shortRouteRequestParams } from "./RequestBuilderPerf.data";
import { CalculateRouteParams } from "../types/CalculateRouteParams";
import { buildCalculateRouteRequest } from "../RequestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";
import { FetchInput } from "../../shared/types/Fetch";
import { CalculateRoutePOSTDataAPI } from "../types/APIPOSTRequestTypes";

describe("Calculate Route request URL building functional tests", () => {
    test.each(requestObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: CalculateRouteParams, fetchInput: FetchInput<CalculateRoutePOSTDataAPI>) => {
            expect(buildCalculateRouteRequest(params)).toStrictEqual(fetchInput);
        }
    );
});

describe("Calculate Route request URL building performance tests", () => {
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(
            bestExecutionTimeMS(() => buildCalculateRouteRequest(shortRouteRequestParams as CalculateRouteParams), 20)
        ).toBeLessThan(MAX_EXEC_TIMES_MS.routing.requestBuilding);
    });
});
