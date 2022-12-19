import { requestObjectsAndURLs } from "./RequestBuilder.data";
import { routeRequestParams } from "./RequestBuilderPerf.data";
import { CalculateRouteParams } from "../types/CalculateRouteParams";
import { buildCalculateRouteRequest } from "../RequestBuilder";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";

describe("Calculate Route request URL building functional tests", () => {
    // @ts-ignore
    test.each(requestObjectsAndURLs)("'%s'", (_name: string, params: CalculateRouteParams, url: string) => {
        expect(buildCalculateRouteRequest(params).toString()).toStrictEqual(url);
    });
});

describe("Calculate Route request URL building performance tests", () => {
    // @ts-ignore
    test("Calculate route request with many waypoints, mandatory & optional params", () => {
        expect(
            bestExecutionTimeMS(() => buildCalculateRouteRequest(routeRequestParams as CalculateRouteParams), 20)
        ).toBeLessThan(5);
    });
});
