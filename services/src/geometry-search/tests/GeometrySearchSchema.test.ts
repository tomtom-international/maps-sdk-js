import geometrySearch from "../GeometrySearch";
import { SearchGeometryInput } from "../types";

describe("GeometrySearch Schema Validation", () => {
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
    test("it should fail when missing coordinates property", async () => {
        const query = "cafe";
        const incorrectGeometry = [{ type: "Circle", radius: 6000 }];

        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject({
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_union",
                    path: ["geometries", 0],
                    message: "Invalid input"
                }
            ]
        });
    });

    test("it should fail when missing type property", async () => {
        const query = "cafe";
        const incorrectGeometry = [{ radius: 6000, coordinates: [37.71205, -121.36434] }];
        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_union",
                    path: ["geometries", 0],
                    message: "Invalid input"
                }
            ]
        });
    });

    test("it should fail when geometryList property is missing", async () => {
        const query = "cafe";
        // @ts-ignore
        await expect(geometrySearch({ query })).rejects.toMatchObject({
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "undefined",
                    path: ["geometries"],
                    message: "Required"
                }
            ]
        });
    });

    test("it should fail when type Circle is missing radius property", async () => {
        const query = "cafe";
        const incorrectGeometry = [
            {
                type: "Circle",
                coordinates: [-121.36434, 37.71205]
            }
        ];

        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "custom",
                    message: 'type: "Circle" must have radius property',
                    path: ["geometries", 0]
                }
            ]
        });
    });

    test("it should fail when query is missing", async () => {
        // @ts-ignore
        await expect(geometrySearch({ geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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

    test("it should fail when query is not of type string", async () => {
        const query = undefined;
        // @ts-ignore
        await expect(geometrySearch({ query, geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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

    test("it should fail when map-code is not of type array", async () => {
        const query = "Fuel Station";
        const mapcodes = "Local";

        // @ts-ignore
        await expect(geometrySearch({ query, geometries, mapcodes })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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
        await expect(geometrySearch({ query, geometries, view })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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

    test("it should fail when index is not of type array", async () => {
        const query = "Noe Valley, San Francisco";
        const indexes = "STR";

        // @ts-ignore
        await expect(geometrySearch({ query, geometries, indexes })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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

    test("it should fail when POI categories are not of type array", async () => {
        const query = "Restaurant";
        const poiCategories = 7315025;

        // @ts-ignore
        await expect(geometrySearch({ query, geometries, poiCategories })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "number",
                    path: ["poiCategories"],
                    message: "Expected array, received number"
                }
            ]
        });
    });

    test("it should fail when POI categories are of type string-array", async () => {
        const query = "Restaurant";
        const poiCategory1 = "7315025";
        const poiCategory2 = "7315017";

        await expect(
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                poiCategories: [poiCategory1, poiCategory2]
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_enum_value",
                    received: "7315025",
                    path: ["poiCategories", 0],
                    message: expect.stringMatching(/^Invalid enum value.*$/)
                },
                {
                    code: "invalid_enum_value",
                    received: "7315017",
                    path: ["poiCategories", 1],
                    message: expect.stringMatching(/^Invalid enum value.*$/)
                }
            ]
        });
    });

    test("it should fail when POI brands is of type string", async () => {
        const query = "Restaurant";
        const poiBrands = "TomTom";

        await expect(
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                poiBrands
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                connectors
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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
        const fuels = "AdBlue";

        await expect(
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                fuels
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "invalid_type",
                    expected: "array",
                    received: "string",
                    path: ["fuels"],
                    message: "Expected array, received string"
                }
            ]
        });
    });

    test("it should fail when geography type is of type string", async () => {
        const query = "EV";
        const geographyTypes = "Municipality";

        await expect(
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                geographyTypes
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
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
            geometrySearch({
                query,
                geometries,
                position: [-95, 200]
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    code: "too_small",
                    minimum: -90,
                    type: "number",
                    inclusive: true,
                    message: "Number must be greater than or equal to -90",
                    path: ["position", 0]
                },
                {
                    code: "too_big",
                    maximum: 180,
                    type: "number",
                    inclusive: true,
                    message: "Number must be less than or equal to 180",
                    path: ["position", 1]
                }
            ]
        });
    });
});
