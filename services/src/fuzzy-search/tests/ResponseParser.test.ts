import { FuzzySearchResponse, FuzzySearchResponseAPI } from "../types";
import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseFuzzySearchResponse } from "../ResponseParser";
import apiResponses from "./ResponseParserPerf.data.json";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";

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
            expect(assertExecutionTime(() => parseFuzzySearchResponse(apiResponse), 10, 5)).toBeTruthy();
        }
    );
});
