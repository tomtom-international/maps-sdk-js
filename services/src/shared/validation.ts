import type { $ZodError, $ZodIssue } from 'zod/v4/core';
import { z } from 'zod/v4-mini';
import { commonServiceRequestSchema } from './commonParamsSchema';
import type { CommonServiceParams } from './serviceTypes';
import type { RequestValidationConfig } from './types/validation';

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @group Shared
 * @ignore
 */
export class ValidationError extends Error {
    issues: $ZodIssue[];

    constructor(zodError: $ZodError) {
        super(z.prettifyError(zodError));
        this.issues = zodError.issues;
    }
}

/**
 * @ignore
 * @param params
 * @param config
 */
export const validateRequestSchema = <T extends CommonServiceParams>(
    params: T,
    config?: RequestValidationConfig,
): T => {
    const requestSchema = config?.schema
        ? z.extend(commonServiceRequestSchema, config.schema.shape)
        : commonServiceRequestSchema;
    // If there's no schema provided, we still validate the common params:
    const mergedSchema = requestSchema.check(
        z.refine(
            (data) => 'commonBaseURL' in data || 'customServiceBaseURL' in data,
            'commonBaseURL or customServiceBaseURL is required',
        ),
    );

    // Adding optional refinements:
    let refinedMergedSchema: typeof mergedSchema | undefined;
    if (config?.refinements?.length) {
        refinedMergedSchema = mergedSchema;
        for (const refinement of config.refinements) {
            refinedMergedSchema = refinedMergedSchema.check(z.refine(refinement.check, refinement.message));
        }
    }

    const validation = (refinedMergedSchema ?? mergedSchema).safeParse(params);
    if (!validation.success) {
        throw new ValidationError(validation.error);
    }

    return params;
};
