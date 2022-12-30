import { z } from "zod";
import { validateRequestSchema } from "../Validation";
import { SchemaRefinement } from "../types/Validation";

describe("Validation", () => {
    test("it should throw Validation error when schema validation fails", () => {
        const schema = z.object({
            apiKey: z.string(),
            position: z.number()
        });

        const params = {
            position: "string"
        };

        expect(() => validateRequestSchema(params as never, { schema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["apiKey"],
                        message: "Required"
                    },
                    {
                        code: "invalid_type",
                        expected: "number",
                        received: "string",
                        path: ["position"],
                        message: "Expected number, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when commonBaseURL or customServiceBaseURL is not passed", () => {
        const schema = z.object({
            position: z.number().array().nonempty()
        });

        const params = {
            apiKey: "",
            position: [123, 321]
        };

        expect(() => validateRequestSchema(params, { schema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "custom",
                        message: "commonBaseURL or customServiceBaseURL is required",
                        path: []
                    }
                ]
            })
        );
    });

    test("custom refinements", () => {
        const schema = z.object({
            optionalA: z.string().optional(),
            optionalA2: z.string().optional(),
            optionalB: z.string().optional()
        });

        const optionalAParamRefinement: SchemaRefinement = {
            check: (data) => {
                if ("optionalA2" in data) {
                    return "optionalA" in data;
                }
                return true;
            },
            message: "If optionalA2 is present, then optionalA must be present as well."
        };

        const optionalABParamRefinement: SchemaRefinement = {
            check: (data) => !("optionalA" in data && "optionalB" in data),
            message: "optionalA and optionalB cannot both be present."
        };

        expect(() =>
            validateRequestSchema(
                {
                    apiKey: "API_KEY",
                    commonBaseURL: "COMMON_BASE_URL",
                    optionalA2: "test2"
                },
                { schema, refinements: [optionalAParamRefinement, optionalABParamRefinement] }
            )
        ).toThrow("If optionalA2 is present, then optionalA must be present as well.");

        expect(() =>
            validateRequestSchema(
                {
                    apiKey: "API_KEY",
                    commonBaseURL: "COMMON_BASE_URL",
                    optionalA: "testA",
                    optionalB: "testB"
                },
                { schema, refinements: [optionalAParamRefinement, optionalABParamRefinement] }
            )
        ).toThrow("optionalA and optionalB cannot both be present.");
    });
});
