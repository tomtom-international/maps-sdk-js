import { GOSDKConfig, Language } from "@anw/go-sdk-js/core";
import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { autocompleteSearchRequestSchema } from "../AutocompleteSearchRequestSchema";
import { AutocompleteSearchParams } from "../types";
import autocompleteSearchReqObjects from "./RequestBuilderPerf.data.json";
import { validateRequestSchema } from "../../shared/Validation";
import { MAX_EXEC_TIMES_MS } from "../../../perfConfig";

describe("Autocomplete Schema Validation", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({
            language: process.env.LANGUAGE as Language
        });
    });

    const commonBaseURL = "https://tomtom.com";
    const apiKey = "API_KEY";
    const query = "cafe";

    test("it should fail when query is missing", () => {
        expect(() =>
            validateRequestSchema({ commonBaseURL, apiKey }, { schema: autocompleteSearchRequestSchema })
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["query"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when query is a number", () => {
        const queryNum = 5;
        expect(() =>
            validateRequestSchema(
                { commonBaseURL, apiKey, query: queryNum },
                { schema: autocompleteSearchRequestSchema }
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "number",
                        path: ["query"],
                        message: "Expected string, received number"
                    }
                ]
            })
        );
    });

    test("it should fail when countries is of type string", () => {
        const countries = "NL";
        expect(() =>
            validateRequestSchema(
                { commonBaseURL, apiKey, query, countries },
                { schema: autocompleteSearchRequestSchema }
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["countries"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when resultType is of type number", () => {
        const resultType = 5;
        expect(() =>
            validateRequestSchema(
                { commonBaseURL, apiKey, query, resultType },
                { schema: autocompleteSearchRequestSchema }
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "number",
                        path: ["resultType"],
                        message: "Expected array, received number"
                    }
                ]
            })
        );
    });

    test("it should fail when radiusMeters is of type string", () => {
        expect(() =>
            validateRequestSchema(
                { commonBaseURL, apiKey, query, radiusMeters: "600" },
                { schema: autocompleteSearchRequestSchema }
            )
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["radiusMeters"],
                        message: "Expected number, received string"
                    }
                ]
            })
        );
    });

    describe("Autocomplete request schema performance tests", () => {
        test.each(autocompleteSearchReqObjects)(
            "'%s'",
            // @ts-ignore
            (_title: string, params: AutocompleteSearchParams) => {
                expect(
                    bestExecutionTimeMS(
                        () => validateRequestSchema(params, { schema: autocompleteSearchRequestSchema }),
                        10
                    )
                ).toBeLessThan(MAX_EXEC_TIMES_MS.autocomplete.schemaValidation);
            }
        );
    });
});
