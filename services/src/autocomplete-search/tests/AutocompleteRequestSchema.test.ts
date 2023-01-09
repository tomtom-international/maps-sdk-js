import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { autocompleteSearchRequestSchema } from "../AutocompleteSearchRequestSchema";
import { AutocompleteSearchParams } from "../types";
import autocompleteSearchReqObjects from "./RequestBuilderPerf.data.json";
import { validateRequestSchema } from "../../shared/Validation";
import { MAX_EXEC_TIMES_MS } from "../../../perfConfig";

describe("Autocomplete Schema Validation", () => {
    const apiKey = "API_KEY";
    const query = "cafe";
    const language = "en-GB";

    test("it should fail when query is missing", () => {
        // @ts-ignore
        const validationResult = () => validateRequestSchema({ apiKey, language }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
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

    test("it should fail when language is missing", () => {
        // @ts-ignore
        const validationResult = () => validateRequestSchema({ apiKey, query }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["language"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when query is a number", () => {
        const queryNum = 5;
        // @ts-ignore
        const validationResult = () =>
            validateRequestSchema({ apiKey, query: queryNum, language }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
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

        const validationResult = () =>
            validateRequestSchema({ apiKey, query, language, countries }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
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

        const validationResult = () =>
            validateRequestSchema({ apiKey, query, language, resultType }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
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
        const radiusMeters = "600";
        const validationResult = () =>
            validateRequestSchema({ apiKey, query, language, radiusMeters }, autocompleteSearchRequestSchema);
        expect(validationResult).toThrow(
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
                    bestExecutionTimeMS(() => validateRequestSchema(params, autocompleteSearchRequestSchema), 10)
                ).toBeLessThan(MAX_EXEC_TIMES_MS.autocomplete.schemaValidation);
            }
        );
    });
});
