import { buildIconFilterExpression, buildIconArrayFilterExpression } from "../filterExpressions";

describe("build filter expression", () => {
    test("filter out single icon ID", () => {
        expect(buildIconFilterExpression(231, "exclude")).toEqual(["!=", ["get", "icon"], 231]);
    });

    test("filter out array of icon IDs", () => {
        expect(buildIconArrayFilterExpression([231, 130, 55], "exclude")).toEqual([
            "all",
            ["!=", ["get", "icon"], 231],
            ["!=", ["get", "icon"], 130],
            ["!=", ["get", "icon"], 55]
        ]);
    });

    test("include single icon ID", () => {
        expect(buildIconFilterExpression(123, "include")).toEqual(["==", ["get", "icon"], 123]);
    });

    test("include array of icon IDs", () => {
        expect(buildIconArrayFilterExpression([231, 130, 55], "include")).toEqual([
            "any",
            ["==", ["get", "icon"], 231],
            ["==", ["get", "icon"], 130],
            ["==", ["get", "icon"], 55]
        ]);
    });
});
