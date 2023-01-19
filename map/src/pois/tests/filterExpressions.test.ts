import {
    buildExcludeIconFilterExpression,
    buildExcludeIconArrayFilterExpression,
    buildIncludeIconFilterExpression,
    buildIncludeIconArrayFilterExpression
} from "../filterExpressions";

describe("build filter expression", () => {
    test("filter out single icon ID", () => {
        expect(buildExcludeIconFilterExpression(231)).toEqual(["!=", ["get", "icon"], 231]);
    });

    test("filter out array of icon IDs", () => {
        expect(buildExcludeIconArrayFilterExpression([231, 130, 55])).toEqual([
            "all",
            ["!=", ["get", "icon"], 231],
            ["!=", ["get", "icon"], 130],
            ["!=", ["get", "icon"], 55]
        ]);
    });

    test("include single icon ID", () => {
        expect(buildIncludeIconFilterExpression(123)).toEqual(["==", ["get", "icon"], 123]);
    });

    test("include array of icon IDs", () => {
        expect(buildIncludeIconArrayFilterExpression([231, 130, 55])).toEqual([
            "any",
            ["==", ["get", "icon"], 231],
            ["==", ["get", "icon"], 130],
            ["==", ["get", "icon"], 55]
        ]);
    });
});
