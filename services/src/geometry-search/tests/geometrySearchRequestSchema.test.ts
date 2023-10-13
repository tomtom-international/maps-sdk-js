import { GeometrySearchParams, SearchGeometryInput } from "../types";
import { geometrySearchRequestSchema } from "../geometrySearchRequestSchema";
import geometrySearchReqObjects from "../../geometry-search/tests/requestBuilderPerf.data.json";
import { bestExecutionTimeMS } from "core/src/util/tests/performanceTestUtils";
import { validateRequestSchema } from "../../shared/validation";
import { MAX_EXEC_TIMES_MS } from "../../shared/tests/perfConfig";

describe("GeometrySearch Schema Validation", () => {
    const config = { schema: geometrySearchRequestSchema };
    const apiKey = "APIKEY";
    const commonBaseURL = "https://api-test.tomtom.com";

    const geometries: SearchGeometryInput[] = [
        {
            type: "Polygon",
            coordinates: [
                [
                    [-122.43576, 37.75241],
                    [-122.433013, 37.7066],
                    [-122.36434, 37.71205],
                    [-122.373962, 37.7535]
                ]
            ]
        },
        {
            type: "Circle",
            coordinates: [-121.36434, 37.71205],
            radius: 6000
        }
    ];

    test("it should pass when poi category is of type array consisting poi category IDs", () => {
        expect(
            validateRequestSchema<GeometrySearchParams>(
                {
                    apiKey,
                    commonBaseURL,
                    query: "restaurant",
                    geometries,
                    poiCategories: [7315, 7315081]
                },
                config
            )
        ).toMatchObject({ query: "restaurant", poiCategories: [7315, 7315081] });
    });

    test("it should pass when poi category is of type array consisting human readable category names", () => {
        expect(
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    query: "restaurant",
                    geometries,
                    poiCategories: ["ITALIAN_RESTAURANT", "FRENCH_RESTAURANT"]
                },
                config
            )
        ).toMatchObject({ query: "restaurant", poiCategories: ["ITALIAN_RESTAURANT", "FRENCH_RESTAURANT"] });
    });

    test("it should fail when missing coordinates property", () => {
        expect(() =>
            validateRequestSchema(
                { query: "cafe", geometries: [{ type: "Circle", radius: 6000 }], apiKey, commonBaseURL },
                config
            )
        ).toThrow("Invalid input");
    });

    test("it should fail when missing type property", () => {
        expect(() =>
            validateRequestSchema(
                {
                    query: "cafe",
                    geometries: [{ radius: 6000, coordinates: [37.71205, -121.36434] }],
                    apiKey,
                    commonBaseURL
                },
                config
            )
        ).toThrow("Invalid input");
    });

    test("it should fail when geometryList property is missing", () => {
        const query = "cafe";
        expect(() => validateRequestSchema({ query, apiKey, commonBaseURL }, config)).toThrow("Required");
    });

    test("it should fail when type Circle is missing radius property", () => {
        const query = "cafe";
        const incorrectGeometry = [
            {
                type: "Circle",
                coordinates: [-121.36434, 37.71205]
            }
        ];

        expect(() =>
            validateRequestSchema({ query, geometries: [incorrectGeometry], apiKey, commonBaseURL }, config)
        ).toThrow("Invalid input");
    });

    test("it should fail when query is missing", () => {
        expect(() => validateRequestSchema({ geometries, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["query"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when query is not of type string", () => {
        const query = undefined;
        expect(() => validateRequestSchema({ query, geometries, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "string",
                        received: "undefined",
                        path: ["query"],
                        message: "Required"
                    }
                ]
            })
        );
    });

    test("it should fail when map-code is not of type array", () => {
        const query = "Fuel Station";
        const mapcodes = "Local";

        expect(() => validateRequestSchema({ query, geometries, mapcodes, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["mapcodes"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when view is not amongst the defined enums", () => {
        const query = "POI";
        const view = "CH";
        expect(() => validateRequestSchema({ query, geometries, view, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
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
            })
        );
    });

    test("it should fail when index is not of type array", () => {
        const query = "Noe Valley, San Francisco";
        const indexes = "STR";

        expect(() => validateRequestSchema({ query, geometries, indexes, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["indexes"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when POI categories are not of type array", () => {
        const query = "Restaurant";
        const poiCategories = 7315025;

        expect(() =>
            validateRequestSchema({ query, geometries, poiCategories, apiKey, commonBaseURL }, config)
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        expected: "array",
                        received: "number",
                        code: "invalid_type",
                        path: ["poiCategories"],
                        message: "Expected array, received number"
                    }
                ]
            })
        );
    });

    test("it should fail when POI categories are of type string-array", () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL,
                    query: "Restaurant",
                    geometries,
                    // @ts-ignore
                    poiCategories: ["7315025"]
                },
                config
            )
        ).toThrow();
    });

    test("it should fail when POI brands is of type string", () => {
        const query = "Restaurant";
        const poiBrands = "TomTom";

        expect(() => validateRequestSchema({ query, geometries, poiBrands, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["poiBrands"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when connectors is of type string", () => {
        const query = "EV";
        const connectors = "IEC62196Type1";

        expect(() => validateRequestSchema({ query, geometries, connectors, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["connectors"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when fuel is of type string", () => {
        const query = "EV";
        const fuelTypes = "AdBlue";

        expect(() => validateRequestSchema({ query, geometries, fuelTypes, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["fuelTypes"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when geography type is of type string", () => {
        const query = "EV";
        const geographyTypes = "Municipality";

        expect(() =>
            validateRequestSchema({ query, geometries, geographyTypes, apiKey, commonBaseURL }, config)
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "invalid_type",
                        expected: "array",
                        received: "string",
                        path: ["geographyTypes"],
                        message: "Expected array, received string"
                    }
                ]
            })
        );
    });

    test("it should fail when lan and lon parameters are not between permitted values", () => {
        const query = "EV";
        const position = [-200, 95];
        expect(() => validateRequestSchema({ query, geometries, position, apiKey, commonBaseURL }, config)).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: "too_small",
                        minimum: -180,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be greater than or equal to -180",
                        path: ["position", 0]
                    },
                    {
                        code: "too_big",
                        maximum: 90,
                        type: "number",
                        inclusive: true,
                        exact: false,
                        message: "Number must be less than or equal to 90",
                        path: ["position", 1]
                    }
                ]
            })
        );
    });
});

describe("Geometry Search request schema performance tests", () => {
    test("Geometry Search request schema performance test", () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(geometrySearchReqObjects as GeometrySearchParams, {
                        schema: geometrySearchRequestSchema
                    }),
                10
            )
        ).toBeLessThan(MAX_EXEC_TIMES_MS.search.geometrySearch.schemaValidation);
    });
});
