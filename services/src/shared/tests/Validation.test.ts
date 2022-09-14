import { AjvValidationErrors, ValidationError } from "../Validation";

describe("Validation", () => {
    test("it should transform Ajv errors", () => {
        const ajvErrors: AjvValidationErrors = [
            {
                instancePath: "limit",
                message: "must <= 100",
                params: { comparison: "<=", limit: 100 },
                keyword: "maximum",
                schemaPath: "#/properties/limit/maximum"
            }
        ];
        const error = new ValidationError("Validation Error", ajvErrors);

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toEqual("Validation Error");
        expect(error.errors[0]).toMatchObject({
            property: ajvErrors[0].instancePath,
            message: ajvErrors[0].message
        });
    });
});
