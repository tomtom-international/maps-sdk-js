import { buildAutocompleteSearchRequest } from "../RequestBuilder";
import autocompleteSearchReqObjectsAndURLs from "./RequestBuilder.data.json";
import { AutocompleteSearchParams } from "../types";
import autocompleteSearchReqObjects from "./RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { MAX_EXEC_TIMES_MS } from "services/perfConfig";

describe("Autocomplete Search request URL building tests", () => {
    test.each(autocompleteSearchReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: AutocompleteSearchParams, requestURL: string) => {
            expect(buildAutocompleteSearchRequest(params).toString()).toStrictEqual(requestURL);
        }
    );
});

describe("Autocomplete request URL builder performance tests", () => {
    test.each(autocompleteSearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: AutocompleteSearchParams) => {
            expect(bestExecutionTimeMS(() => buildAutocompleteSearchRequest(params), 10)).toBeLessThan(
                MAX_EXEC_TIMES_MS.autocomplete.requestBuilding
            );
        }
    );
});
