import Ajv, { ErrorObject } from "ajv";
import { CommonServiceParams } from "./ServiceTypes";

const ajv = new Ajv();

export type AjvValidationErrors = ErrorObject<string, Record<string, any>, unknown>[];
type ValidationErrorResponse = { property: string; message: string | undefined }[];

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @group Shared
 * @category Types
 */
export class ValidationError extends Error {
    errors: ValidationErrorResponse;

    constructor(message: string, errors: AjvValidationErrors | null | undefined) {
        super(message);
        this.errors = errors ? this.transformErrors(errors) : [];
    }

    private transformErrors(errors: AjvValidationErrors): ValidationErrorResponse {
        const formattedErrors = errors.map((error) => ({
            property: error.instancePath,
            message: error.message
        }));

        return formattedErrors;
    }
}

export const validateSchema = <T extends CommonServiceParams>(params: T, schema: any): T => {
    if (schema) {
        const validate = ajv.compile(schema);
        if (!validate(params)) {
            throw new ValidationError("Validation error", validate.errors);
        }
    }

    return params;
};
