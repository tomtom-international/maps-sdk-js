import { ValidationError } from "../Validation";

const errors: { instancePath: string; message: string }[] = [
    {
        instancePath: "limit",
        message: "must <= 100"
    }
];

describe("Validation", () => {
    test("it should transform Ajv errors", () => {
        const error = new ValidationError("Validation Error", errors);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toEqual("Validation Error");
        expect(error.errors[0]).toMatchObject({
            property: errors[0].instancePath,
            message: errors[0].message
        });
    });
});
