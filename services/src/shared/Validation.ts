import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import { CommonServiceParams } from "./ServiceTypes";

const ajv = new Ajv();

/**
 * Validate Error Class for validating params input, this will be used by SDKError class.
 * @group Shared
 * @category Types
 */
export class ValidationError extends Error {
    errors: any[];

    constructor(message: string, errors: any) {
        super(message);
        this.errors = this.transformErrors(errors);
    }

    private transformErrors(errors: ErrorObject[]): { property: string; message: string | undefined }[] {
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
