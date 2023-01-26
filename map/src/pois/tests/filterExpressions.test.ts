import {
    buildIconFilterExpression,
    buildIconArrayFilterExpression,
    combineWithExistingFilter
} from "../filterExpressions";

describe("build filter expression", () => {
    test("filter out single icon ID", () => {
        expect(buildIconFilterExpression(231, "all_except")).toEqual(["!=", ["get", "icon"], 231]);
    });

    test("filter out array of icon IDs", () => {
        expect(buildIconArrayFilterExpression([231, 130, 55], "all_except")).toEqual([
            "all",
            ["!=", ["get", "icon"], 231],
            ["!=", ["get", "icon"], 130],
            ["!=", ["get", "icon"], 55]
        ]);
    });

    test("include single icon ID", () => {
        expect(buildIconFilterExpression(123, "only")).toEqual(["==", ["get", "icon"], 123]);
    });

    test("include array of icon IDs", () => {
        expect(buildIconArrayFilterExpression([231, 130, 55], "only")).toEqual([
            "any",
            ["==", ["get", "icon"], 231],
            ["==", ["get", "icon"], 130],
            ["==", ["get", "icon"], 55]
        ]);
    });

    test("try to include an empty array", () => {
        expect(buildIconArrayFilterExpression([], "only")).toEqual(["any"]);
    });

    test("combine category filter with existing layer filter", () => {
        expect(combineWithExistingFilter([231, 130, 55], "only", ["==", ["get", "name"], "test"])).toEqual([
            "all",
            ["any", ["==", ["get", "icon"], 231], ["==", ["get", "icon"], 130], ["==", ["get", "icon"], 55]],
            ["==", ["get", "name"], "test"]
        ]);
    });
});
