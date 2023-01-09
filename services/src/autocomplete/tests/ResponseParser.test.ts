import { AutocompleteResponse, AutocompleteResponseAPI } from "../types";
import apiAndParsedResponses from "./ResponseParser.data.json";
import { parseAutocompleteResponse } from "../ResponseParser";
import apiResponses from "./ResponseParserPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Autocomplete response parser tests", () => {
    test.each(apiAndParsedResponses)(
        "'%s'",
        // @ts-ignore
        (_name: string, apiResponse: AutocompleteResponseAPI, parsedResponse: AutocompleteResponse) => {
            expect(parseAutocompleteResponse(apiResponse)).toStrictEqual(parsedResponse);
        }
    );
});

describe("Autocomplete response parser performance tests", () => {
    test.each(apiResponses)(
        "'%s'",
        // @ts-ignore
        (_title: string, apiResponse: AutocompleteResponseAPI) => {
            expect(bestExecutionTimeMS(() => parseAutocompleteResponse(apiResponse), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.autocomplete.responseParsing
            );
        }
    );
});
