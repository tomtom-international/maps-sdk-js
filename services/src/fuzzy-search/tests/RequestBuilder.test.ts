import { buildFuzzySearchRequest } from "../RequestBuilder";
import fuzzySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import { FuzzySearchParams } from "../types";
import fuzzySearchReqObjects from "./RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import perfConfig from "services/perfConfig.json";

describe("Calculate Fuzzy Search request URL building tests", () => {
    test.each(fuzzySearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: FuzzySearchParams, requestURL: string) => {
            expect(buildFuzzySearchRequest(params).toString()).toStrictEqual(requestURL);
        }
    );
});

describe("Fuzzy Search request URL builder performance tests", () => {
    test("Fuzzy Search request URL builder tests", async () => {
        expect(
            bestExecutionTimeMS(() => buildFuzzySearchRequest(fuzzySearchReqObjects as FuzzySearchParams), 10)
        ).toBeLessThan(perfConfig.search.fuzzySearch.requestBuilding);
    });
});
