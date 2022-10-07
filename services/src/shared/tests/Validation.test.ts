import { z } from "zod";
import { validateRequestSchema, ValidationError } from "../Validation";

describe("Validation", () => {
    test("no errors to transform", () => {
        const error = new ValidationError("Validation Error");
        expect(error.message).toEqual("Validation Error");
        expect(error.errors).toBe(undefined);
    });

    test("it should throw Validation error when schema validation fails", () => {
        const schema = z.object({
            apiKey: z.string(),
            position: z.number()
        });

        const params = {
            position: "string"
        };

        // @ts-ignore
        const validationResult = () => validateRequestSchema(params, schema);

        expect(validationResult).toThrow(
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

    test("it should fails when commonBaseURL or customServiceBaseURL are not passed", () => {
        const schema = z.object({
            position: z.number().array().nonempty()
        });

        const params = {
            apiKey: "",
            position: [123, 321]
        };

        const validationResult = () => validateRequestSchema(params, schema);

        expect(validationResult).toThrow(
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
});
