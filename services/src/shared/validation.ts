import type { ZodError, ZodIssue } from "zod";
import { commonServiceRequestSchema } from "./commonParamsSchema";
import type { CommonServiceParams } from "./serviceTypes";
import type { RequestValidationConfig } from "./types/validation";

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
    // If there's no schema provided, we still validate the common params:
    const mergedSchema = (
        config?.schema ? commonServiceRequestSchema.merge(config.schema) : commonServiceRequestSchema
    ).refine(
        (data) => "commonBaseURL" in data || "customServiceBaseURL" in data,
        "commonBaseURL or customServiceBaseURL is required"
    );

    // Adding optional refinements:
    let refinedMergedSchema;
    if (config?.refinements?.length) {
        refinedMergedSchema = mergedSchema;
        for (const refinement of config.refinements) {
            refinedMergedSchema = refinedMergedSchema.refine(refinement.check, refinement.message);
        }
    }

    const validation = (refinedMergedSchema || mergedSchema).safeParse(params);
    if (!validation.success) {
        throw new ValidationError(validation.error);
    }

    return params;
};
