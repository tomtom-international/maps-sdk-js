import { bestExecutionTimeMS } from "core/src/util/tests/PerformanceTestUtils";
import { autocompleteRequestSchema } from "../AutocompleteRequestSchema";
import { AutocompleteParams } from "../types";
import autocompleteReqObjects from "./RequestBuilderPerf.data.json";
import { validateRequestSchema } from "../../shared/Validation";

describe("Autocomplete Schema Validation", () => {
    const apiKey = "API_KEY";
    const query = "cafe";
    const language = "en-GB";

    test("it should fail when query is missing", () => {
        // @ts-ignore
        const validationResult = () => validateRequestSchema({ apiKey, language }, autocompleteRequestSchema);
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
        const validationResult = () => validateRequestSchema({ apiKey, query }, autocompleteRequestSchema);
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
            validateRequestSchema({ apiKey, query: queryNum, language }, autocompleteRequestSchema);
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
            validateRequestSchema({ apiKey, query, language, countries }, autocompleteRequestSchema);
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
            validateRequestSchema({ apiKey, query, language, resultType }, autocompleteRequestSchema);
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
            validateRequestSchema({ apiKey, query, language, radiusMeters }, autocompleteRequestSchema);
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
        test.each(autocompleteReqObjects)(
            "'%s'",
            // @ts-ignore
            (_title: string, params: AutocompleteParams) => {
                expect(
                    bestExecutionTimeMS(() => validateRequestSchema(params, autocompleteRequestSchema), 10)
                ).toBeLessThan(7);
            }
        );
    });
});
