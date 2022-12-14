import fuzzySearch from "../FuzzySearch";
import { assertExecutionTime } from "../../shared/tests/PerformanceTestUtils";
import { fuzzySearchRequestSchema } from "../FuzzySearchRequestSchema";
import { FuzzySearchParams } from "../types";
import fuzzySearchReqObjects from "./RequestBuilderPerf.data.json";
import { validateRequestSchema } from "../../shared/Validation";

describe("FuzzySearch Schema Validation", () => {
    test("it should pass when poi category is of type array consisting poi category IDs", () => {
        expect(
            fuzzySearchRequestSchema.parse({
                query: "restaurant",
                poiCategories: [7315, 7315081]
            })
        ).toMatchObject({ query: "restaurant", poiCategories: [7315, 7315081] });
    });

    test("it should pass when poi category is of type array consisting human readable category names", () => {
        expect(
            fuzzySearchRequestSchema.parse({
                query: "restaurant",
                poiCategories: ["ITALIAN_RESTAURANT", "FRENCH_RESTAURANT"]
            })
        ).toMatchObject({ query: "restaurant", poiCategories: ["ITALIAN_RESTAURANT", "FRENCH_RESTAURANT"] });
    });

    test("it should fail when missing mandatory query", async () => {
        const limit = 10;
        // @ts-ignore
        await expect(fuzzySearch({ limit })).rejects.toMatchObject({
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    path: ["query"],
                    message: "Required"
                }
            ]
        });
    });

    test("it should fail when query is not of type string", async () => {
        const query = undefined;
        // @ts-ignore
        await expect(fuzzySearch({ query })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "string",
                    received: "undefined",
                    path: ["query"],
                    message: "Required"
                }
            ]
        });
    });

    test("it should fail when typeahead has wrong value", async () => {
        const query = "restaurant";
        const typeahead = 1;
        // @ts-ignore
        await expect(fuzzySearch({ query, typeahead })).rejects.toMatchObject({
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "boolean",
                    received: "number",
                    path: ["typeahead"],
                    message: "Expected boolean, received number"
                }
            ]
        });
    });

    test("it should fail when minFuzzyLevel has invalid number", async () => {
        const query = "restaurant";
        const minFuzzyLevel = 6;

        await expect(fuzzySearch({ query, minFuzzyLevel })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "too_big",
                    message: "Number must be less than or equal to 4",
                    path: ["minFuzzyLevel"]
                }
            ]
        });
    });

    //
    test("it should fail when map-code is not of type array", async () => {
        const query = "Fuel Station";
        const mapcodes = "Local";

        // @ts-ignore
        await expect(fuzzySearch({ query, mapcodes })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["mapcodes"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when view is not amongst the defined enums", async () => {
        const query = "POI";
        const view = "CH";
        //@ts-ignore
        await expect(fuzzySearch({ query, view })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    received: "CH",
                    code: "invalid_enum_value",
                    options: ["Unified", "AR", "IN", "PK", "IL", "MA", "RU", "TR", "CN"],
                    path: ["view"],
                    message:
                        "Invalid enum value. " +
                        "Expected 'Unified' | 'AR' | 'IN' | 'PK' | 'IL' | 'MA' | 'RU' | 'TR' | 'CN', received 'CH'"
                }
            ]
        });
    });
    //
    test("it should fail when index is not of type array", async () => {
        const query = "Noe Valley, San Francisco";
        const indexes = "STR";

        // @ts-ignore
        await expect(fuzzySearch({ query, indexes })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["indexes"],
                    message: "Expected array, received string"
                }
            ]
        });
    });
    //
    test("it should fail when POI categories are not of type array", async () => {
        const query = "Restaurant";
        const poiCategories = 7315025;

        // @ts-ignore
        await expect(fuzzySearch({ query, poiCategories })).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    path: ["poiCategories"],
                    message: "Expected array, received number"
                }
            ]
        });
    });

    test("it should fail when POI brands is of type string", async () => {
        const query = "Restaurant";
        const poiBrands = "TomTom";

        await expect(
            fuzzySearch({
                query,
                // @ts-ignore
                poiBrands
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["poiBrands"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when connectors is of type string", async () => {
        const query = "EV";
        const connectors = "IEC62196Type1";

        await expect(
            fuzzySearch({
                query,
                // @ts-ignore
                connectors
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["connectors"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when fuel is of type string", async () => {
        const query = "EV";
        const fuelTypes = "AdBlue";

        await expect(
            fuzzySearch({
                query,
                // @ts-ignore
                fuelTypes
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["fuelTypes"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when geography type is of type string", async () => {
        const query = "EV";
        const geographyTypes = "Municipality";

        await expect(
            fuzzySearch({
                query,
                // @ts-ignore
                geographyTypes
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["geographyTypes"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when lan and lon parameters are not between permitted values", async () => {
        const query = "EV";

        await expect(
            fuzzySearch({
                query,
                position: [190, -95]
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "FuzzySearch",
            errors: [
                {
                    code: "too_big",
                    maximum: 180,
                    type: "number",
                    inclusive: true,
                    message: "Number must be less than or equal to 180",
                    path: ["position", 0]
                },
                {
                    code: "too_small",
                    minimum: -90,
                    type: "number",
                    inclusive: true,
                    message: "Number must be greater than or equal to -90",
                    path: ["position", 1]
                }
            ]
        });
    });
});

describe("Fuzzy Search request schema performance tests", () => {
    test.each(fuzzySearchReqObjects)(
        "'%s'",
        // @ts-ignore
        (_title: string, params: FuzzySearchParams) => {
            expect(
                assertExecutionTime(() => validateRequestSchema(params, fuzzySearchRequestSchema), 10, 5)
            ).toBeTruthy();
        }
    );
});
