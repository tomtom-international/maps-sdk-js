import geometrySearch from "../GeometrySearch";
import { GeometrySDK } from "../types";

describe("GeometrySearch Validation", () => {
    const geometries: GeometrySDK[] = [
        {
            type: "Polygon",
            coordinates: [
                [
                    [37.7524152343544, -122.43576049804686],
                    [37.70660472542312, -122.4330139160156],
                    [37.712059855877314, -122.36434936523438],
                    [37.75350561243041, -122.37396240234374]
                ]
            ]
        },
        {
            type: "Circle",
            coordinates: [37.71205, -121.36434],
            radius: 6000
        }
    ];
    test("it should fail when missing coordinates property", async () => {
        const query = "cafe";
        const incorrectGeometry = [{ radius: 6000 }];
        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geometries/0",
                    message: "must have required property 'coordinates'"
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
                    property: "/geometries/0",
                    message: "must have required property 'type'"
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
                    message: "must have required property 'geometries'",
                    property: ""
                }
            ]
        });
    });

    test("it should fail when type Circle is missing radius property", async () => {
        const query = "cafe";
        const incorrectGeometry = [
            {
                type: "Circle",
                coordinates: [37.71205, -121.36434]
            }
        ];

        // @ts-ignore
        await expect(geometrySearch({ query, geometries: incorrectGeometry })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geometries/0",
                    message: "must have required property 'radius'"
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
                    property: "",
                    message: "must have required property 'query'"
                }
            ]
        });
    });

    test("it should fail when query is not of type string", async () => {
        let restaurant;
        const query = restaurant;
        // @ts-ignore
        await expect(geometrySearch({ query, geometries })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "",
                    message: "must have required property 'query'"
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
                    property: "/mapcodes",
                    message: "must be array"
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
                    property: "/view",
                    message: "must be equal to one of the allowed values"
                }
            ]
        });
    });

    test("it should fail when geography is not of type array", async () => {
        const query = "POI";
        const geographyType = "MunicipalitySubdivision";

        // @ts-ignore
        await expect(geometrySearch({ query, geometries, geographyType })).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/geographyType",
                    message: "must be array"
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
                    property: "/indexes",
                    message: "must be array"
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
                    property: "/poiCategories",
                    message: "must be array"
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
                    property: "/poiCategories/0",
                    message: "must be number"
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
                    property: "/poiBrands",
                    message: "must be array"
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
                    property: "/connectors",
                    message: "must be array"
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
                    property: "/fuels",
                    message: "must be array"
                }
            ]
        });
    });

    test("it should fail when entity-type is of type string", async () => {
        const query = "EV";
        const entityTypes = "Municipality";

        await expect(
            geometrySearch({
                query,
                geometries,
                // @ts-ignore
                entityTypes
            })
        ).rejects.toMatchObject({
            message: "Validation error",
            service: "GeometrySearch",
            errors: [
                {
                    property: "/entityTypes",
                    message: "must be array"
                }
            ]
        });
    });
});
