import { buildFuzzySearchRequest } from "../RequestBuilder";
import fuzzySearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import { FuzzySearchParams } from "../types";
import fuzzySearchReqObjects from "./RequestBuilderPerf.data.json";
import { GeometrySearchParams } from "../../geometry-search";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";

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
    test.each(fuzzySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: GeometrySearchParams) => {
            expect(bestExecutionTimeMS(() => buildFuzzySearchRequest(params), 10)).toBeLessThan(2);
        }
    );
});
