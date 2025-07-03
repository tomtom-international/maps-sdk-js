import type { ZodMiniObject } from 'zod/v4-mini';

/**
 * @ignore
 */
export type SchemaRefinement<T = any> = { check: (data: T) => boolean; message: string };

/**
 * Configuration for services request validation.
 * @ignore
 */
export type RequestValidationConfig<Params = any> = {
    /**
     * Schema from Zod for validating input parameters.
     * This will be compiled and used for validation.
     * @see https://zod.dev/?id=basic-usage
     */
    schema: ZodMiniObject;
    /**
     * Optional refinements from Zod for schema.refine advanced calls.
     * @see ZodObject.refine
     */
    refinements?: SchemaRefinement<Params>[];
};
