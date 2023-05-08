import { buildValuesFilter, getMergedAllFilter, getMergedAnyFilter, getSyntaxVersion } from "../mapLibreFilterUtils";

describe("MapLibreUtils tests", () => {
    // Ported from https://github.com/maplibre/maplibre-gl-js/blob/main/src/style-spec/feature_filter/feature_filter.test.ts
    describe("legacy filter detection", () => {
        test("definitely legacy filters", () => {
            // Expressions with more than two arguments.
            expect(getSyntaxVersion(["in", "color", "red", "blue"])).toBe("legacy");

            // Expressions where the second argument is not a string or array.
            expect(getSyntaxVersion(["in", "value", 42])).toBe("legacy");
            expect(getSyntaxVersion(["in", "value", true])).toBe("legacy");
        });

        test("ambiguous value", () => {
            // Should err on the side of reporting as a legacy filter. Style authors can force filters
            // by using a literal expression as the first argument.
            expect(getSyntaxVersion(["in", "color", "red"])).toBe("legacy");
        });

        test("definitely expressions", () => {
            expect(getSyntaxVersion(["in", ["get", "color"], "reddish"])).toBe("expression");
            expect(getSyntaxVersion(["in", ["get", "color"], ["literal", ["red", "blue"]]])).toBe("expression");
            expect(getSyntaxVersion(["in", 42, 42])).toBe("expression");
            expect(getSyntaxVersion(["in", true, true])).toBe("expression");
            expect(getSyntaxVersion(["in", "red", ["get", "colors"]])).toBe("expression");
        });

        // Extra tests for getSyntaxVersion:
        test("getSyntaxVersion", () => {
            expect(getSyntaxVersion(["==", "prop", "value"])).toBe("legacy");
            expect(getSyntaxVersion(["==", ["get", "prop"], "value"])).toBe("expression");
            expect(getSyntaxVersion(["all", ["==", "category", "built_up_area"]])).toBe("legacy");
            expect(getSyntaxVersion(["all", ["has", "treaty"]])).toBe("expression");
            expect(getSyntaxVersion(["all", ["!has", "disputed"], ["has", "treaty"]])).toBe("legacy");
            expect(getSyntaxVersion(["all", ["has", "disputed"], ["!has", "treaty"]])).toBe("legacy");
            expect(
                getSyntaxVersion([
                    "all",
                    [">=", ["zoom"], 3],
                    ["has", "icon"],
                    ["!=", ["get", "name"], " "],
                    ["==", ["get", "category"], "settlement"],
                    ["==", ["get", "subcategory"], "city"],
                    ["==", ["get", "capital"], "country"]
                ])
            ).toBe("expression");
            expect(
                getSyntaxVersion([
                    "all",
                    ["in", "category", "motorway", "trunk", "primary"],
                    ["!=", "tunnel", true],
                    ["!=", "under_construction", true]
                ])
            ).toBe("legacy");
            expect(
                getSyntaxVersion([
                    "all",
                    [">=", ["zoom"], 3],
                    ["!=", "name", " "],
                    ["has", "icon"],
                    ["==", "category", "settlement"],
                    ["==", "subcategory", "city"],
                    ["==", "capital", "country"]
                ])
            ).toBe("legacy");
            expect(getSyntaxVersion(["in", ["get", "city"], ["literal", ["Amsterdam", "Barcelona"]]])).toBe(
                "expression"
            );
            expect(getSyntaxVersion(["in", "city", "Amsterdam", "Barcelona"])).toBe("legacy");
        });
    });

    test("buildValuesFilter", () => {
        expect(buildValuesFilter("testProp", { show: "only", values: [3] })).toStrictEqual({
            expression: ["==", ["get", "testProp"], 3],
            legacy: ["==", "testProp", 3]
        });
        expect(buildValuesFilter("testProp", { show: "all_except", values: [3] })).toStrictEqual({
            expression: ["!=", ["get", "testProp"], 3],
            legacy: ["!=", "testProp", 3]
        });
        expect(buildValuesFilter("testProp", { show: "only", values: ["a", "b"] })).toStrictEqual({
            expression: ["in", ["get", "testProp"], ["literal", ["a", "b"]]],
            legacy: ["in", "testProp", "a", "b"]
        });
        expect(buildValuesFilter("testProp", { show: "all_except", values: [true, false] })).toStrictEqual({
            expression: ["!", ["in", ["get", "testProp"], ["literal", [true, false]]]],
            legacy: ["!in", "testProp", true, false]
        });
    });

    test("getMergedAnyFilter", () => {
        expect(getMergedAnyFilter(undefined as never)).toBeNull();
        expect(getMergedAnyFilter([])).toBeNull();

        expect(
            getMergedAnyFilter([
                {
                    expression: ["==", ["get", "foo"], 3],
                    legacy: ["==", "foo", 3]
                }
            ])
        ).toStrictEqual({
            expression: ["==", ["get", "foo"], 3],
            legacy: ["==", "foo", 3]
        });

        expect(
            getMergedAnyFilter([
                {
                    expression: ["==", ["get", "foo"], 3],
                    legacy: ["==", "foo", 3]
                },
                {
                    expression: ["has", "bar"],
                    legacy: ["has", "bar"]
                }
            ])
        ).toStrictEqual({
            expression: ["any", ["==", ["get", "foo"], 3], ["has", "bar"]],
            legacy: ["any", ["==", "foo", 3], ["has", "bar"]]
        });
    });

    test("getMergedAllFilter", () => {
        expect(
            getMergedAllFilter(
                {
                    expression: ["==", ["get", "something"], 2],
                    legacy: ["==", "something", 2]
                },
                undefined
            )
        ).toStrictEqual(["==", ["get", "something"], 2]);

        // merging with expression syntax filter:
        expect(
            getMergedAllFilter(
                {
                    expression: ["==", ["get", "something"], 2],
                    legacy: ["==", "something", 2]
                },
                ["!=", ["get", "blah"], 5]
            )
        ).toStrictEqual(["all", ["==", ["get", "something"], 2], ["!=", ["get", "blah"], 5]]);

        // merging with legacy syntax filter:
        expect(
            getMergedAllFilter(
                {
                    expression: ["==", ["get", "something"], 2],
                    legacy: ["==", "something", 2]
                },
                ["!=", "blah", 5]
            )
        ).toStrictEqual(["all", ["==", "something", 2], ["!=", "blah", 5]]);
    });
});
