import { asDefined, assertDefined } from "../assertionUtils";

describe("Test related to assertion utils", () => {
    test("assertDefined", () => {
        expect(() => assertDefined(undefined)).toThrow();
        expect(() => assertDefined(null)).toThrow();
        expect(() => assertDefined("something")).not.toThrow();
    });

    test("asDefined", () => {
        expect(() => asDefined(undefined)).toThrow();
        expect(() => asDefined(null)).toThrow();
        expect(asDefined("something")).toStrictEqual("something");
    });
});
