import { buildAutocompleteRequest } from "../RequestBuilder";
import autocompleteReqObjectsAndURLs from "./RequestBuilder.data.json";
import { AutocompleteParams } from "../types";
import autocompleteReqObjects from "./RequestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";

describe("Autocomplete Search request URL building tests", () => {
    test.each(autocompleteReqObjectsAndURLs)(
        "'%s'",
        // @ts-ignore
        (_name: string, params: AutocompleteParams, requestURL: string) => {
            expect(buildAutocompleteRequest(params).toString()).toStrictEqual(requestURL);
        }
    );
});

describe("Autocomplete request URL builder performance tests", () => {
    test.each(autocompleteReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: AutocompleteParams) => {
            expect(bestExecutionTimeMS(() => buildAutocompleteRequest(params), 10)).toBeLessThan(2);
        }
    );
});
