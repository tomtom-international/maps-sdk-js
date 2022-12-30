import { ZodError, ZodIssue } from "zod";
import { commonServiceRequestSchema } from "./CommonParamsSchema";
import { CommonServiceParams } from "./ServiceTypes";
import { RequestValidationConfig } from "./types/Validation";

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @group Shared
 * @ignore
 */
export class ValidationError extends Error {
    errors: ZodIssue[];

    constructor(error: ZodError) {
        super(error.errors[0].message);
        this.errors = error.errors;
    }
}

/**
 * @ignore
 * @param params
 * @param config
 */
export const validateRequestSchema = <T extends CommonServiceParams>(
    params: T,
    config?: RequestValidationConfig
): T => {
    if (config?.schema) {
        const mergedSchema = commonServiceRequestSchema
            .merge(config.schema)
            .refine(
                (data) => "commonBaseURL" in data || "customServiceBaseURL" in data,
                "commonBaseURL or customServiceBaseURL is required"
            );

        // optional refinements:
        let refinedMergedSchema;
        if (config.refinements?.length) {
            refinedMergedSchema = mergedSchema;
            for (const refinement of config.refinements) {
                refinedMergedSchema = refinedMergedSchema.refine(refinement.check, refinement.message);
            }
        }

        const validation = (refinedMergedSchema || mergedSchema).safeParse(params);
        if (!validation.success) {
            throw new ValidationError(validation.error);
        }
    }

    return params;
};
