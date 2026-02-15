import type { ZodError } from 'zod';
import type { CommonServiceParams } from '../serviceTypes';
import type { RequestValidationConfig } from '../types/validation';
import { commonServiceRequestSchema } from './commonParamsSchema';

/**
 * Format a Zod error into a human-readable string
 * @ignore
 */
const formatZodError = (error: ZodError): string => {
    return error.issues
        .map((issue) => {
            const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
            return `${path}${issue.message}`;
        })
        .join('; ');
};

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @ignore
 */
export class ValidationError extends Error {
    issues: ZodError['issues'];

    constructor(zodError: ZodError) {
        super(formatZodError(zodError));
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
        ? commonServiceRequestSchema.extend(config.schema.shape)
        : commonServiceRequestSchema;

    // Apply all refinements using superRefine for better type compatibility in Zod v4
    const finalSchema = requestSchema.superRefine((data, ctx) => {
        // Validate common params
        if (!('commonBaseURL' in data) && !('customServiceBaseURL' in data)) {
            ctx.addIssue({
                code: 'custom',
                message: 'commonBaseURL or customServiceBaseURL is required',
            });
        }

        // Apply optional refinements
        if (config?.refinements?.length) {
            for (const refinement of config.refinements) {
                if (!refinement.check(data as T)) {
                    ctx.addIssue({
                        code: 'custom',
                        message: refinement.message,
                    });
                }
            }
        }
    });

    const validation = finalSchema.safeParse(params);
    if (!validation.success) {
        throw new ValidationError(validation.error);
    }

    return params;
};
