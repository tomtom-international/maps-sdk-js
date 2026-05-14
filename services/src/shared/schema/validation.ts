import type { ZodError } from 'zod';
import type { CommonServiceParams } from '../serviceTypes';
import type { RequestValidationConfig } from '../types/validation';
import { commonServiceRequestSchema } from './commonParamsSchema';

type ZodIssue = ZodError['issues'][number];

/**
 * Format a Zod error into a human-readable string
 * @ignore
 */
const formatZodIssue = (issue: ZodIssue, depth = 0): string => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    if (issue.code === 'invalid_union') {
        const unionErrors = (issue as ZodIssue & { unionErrors?: ZodError[] }).unionErrors;
        if (unionErrors?.length) {
            const branches = unionErrors
                .map((unionError, i) => {
                    const branchIssues = unionError.issues
                        .map((nested) => formatZodIssue(nested, depth + 1))
                        .join(', ');
                    return `option[${i}]: { ${branchIssues} }`;
                })
                .join(' | ');
            return `${path}no matching union member (${branches})`;
        }
    }
    return `${path}${issue.message}`;
};

const formatZodError = (error: ZodError): string => {
    return error.issues.map((issue) => formatZodIssue(issue)).join('; ');
};

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @ignore
 */
export class ValidationError extends Error {
    issues: ZodError['issues'];

    constructor(zodError: ZodError) {
        const message = formatZodError(zodError);
        const issuesSummary = JSON.stringify(zodError.issues, null, 2);
        super(`${message}\nIssues: ${issuesSummary}`);
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
