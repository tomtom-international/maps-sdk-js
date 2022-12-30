import { ZodObject, ZodRawShape } from "zod";

/**
 * @ignore
 */
export type SchemaRefinement = { check: (data: any) => boolean; message: string };

/**
 * Configuration for services request validation.
 * @ignore
 */
export type RequestValidationConfig = {
    /**
     * Schema from Zod for validating input parameters.
     * This will be compiled and used for validation.
     * @see https://zod.dev/?id=basic-usage
     */
    schema: ZodObject<ZodRawShape>;
    /**
     * Optional refinements from Zod for schema.refine advanced calls.
     * @see ZodObject.refine
     */
    refinements?: SchemaRefinement[];
};
