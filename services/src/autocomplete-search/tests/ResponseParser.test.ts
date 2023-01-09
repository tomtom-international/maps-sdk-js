import { AutocompleteSearchResponse, AutocompleteSearchResponseAPI } from "../types";
import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseAutocompleteSearchResponse } from "../ResponseParser";
import apiResponses from "./ResponseParserPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Autocomplete response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: AutocompleteSearchResponseAPI, parsedResponse: AutocompleteSearchResponse) => {
            expect(parseAutocompleteSearchResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Autocomplete response parser performance tests", () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, apiResponse: AutocompleteSearchResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseAutocompleteSearchResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.autocomplete.responseParsing
            );
        }
    );
});
