import { ZodError, ZodIssue, ZodObject } from "zod";
import { CommonServiceRequestSchema } from "./CommonParamsSchema";
import { CommonServiceParams } from "./ServiceTypes";

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @group Shared
 * @ignore
 */
export class ValidationError extends Error {
    errors: ZodIssue[] | undefined;

    constructor(message: string, errors?: ZodError) {
        super(message);
        this.errors = errors && errors.errors;
    }
}

/**
 * @ignore
 * @param params
 * @param schema
 */
export const validateRequestSchema = <T extends CommonServiceParams>(params: T, schema?: ZodObject<any>): T => {
    if (schema) {
        const validate = schema
            .merge(CommonServiceRequestSchema)
            // Check if there is commonBaseURL or customServiceBaseURL set in data
            .refine(
                (data) => "commonBaseURL" in data || "customServiceBaseURL" in data,
                "commonBaseURL or customServiceBaseURL is required"
            )
            .safeParse(params);

        if (!validate.success) {
            throw new ValidationError("Validation error", validate.error);
        }
    }

    return params;
};
