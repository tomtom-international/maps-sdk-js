import { FuzzySearchResponse, FuzzySearchResponseAPI } from "../types";
import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseFuzzySearchResponse } from "../ResponseParser";
import apiResponses from "./ResponseParserPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Fuzzy Search response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: FuzzySearchResponseAPI, parsedResponse: FuzzySearchResponse) => {
            expect(parseFuzzySearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Fuzzy Search response parser performance tests", () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, apiResponse: FuzzySearchResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseFuzzySearchResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.search.fuzzySearch.responseParsing
            );
        }
    );
});
