import type { Places } from "@anw/maps-sdk-js/core";
import { TomTomConfig } from "@anw/maps-sdk-js/core";
import { geometryData } from "../geometryData";
import places from "./geometryDataIntegration.data.json";
import type { GeometryDataResponseAPI } from "../types/apiTypes";

describe("Geometry data errors", () => {
    test("Geometry data test without API key", async () => {
        await expect(geometryData({ geometries: ["GEOMETRY_ID"] })).rejects.toMatchObject({
            service: "GeometryData",
            message: "Request failed with status code 403",
            status: 403
        });
    });

    test("Geometry data test without geometries supplied", async () => {
        await expect(
            geometryData({ apiKey: "KEY", commonBaseURL: "https://api.tomtom.com", geometries: [] })
        ).rejects.toMatchObject({
            service: "GeometryData",
            errors: [
                {
                    code: "too_small",
                    path: ["geometries"],
                    message: "Array must contain at least 1 element(s)"
                }
            ]
        });
    });
});

describe("Geometry data integration tests", () => {
    beforeAll(() => {
        TomTomConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    test("Geometry data of Schiphol airport", async () => {
        const result = await geometryData({ geometries: ["00004e4c-3100-3c00-0000-000059685013"] });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: "00004e4c-3100-3c00-0000-000059685013",
                    properties: {},
                    bbox: expect.any(Array),
                    geometry: {
                        type: "Polygon",
                        coordinates: expect.arrayContaining([])
                    }
                }
            ]
        });
    });

    test("Geometry data of Spain", async () => {
        const result = await geometryData({ geometries: ["00005858-5800-1200-0000-000077363e00"], zoom: 5 });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: "00005858-5800-1200-0000-000077363e00",
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.arrayContaining([])
                    }
                }
            ]
        });
    });

    test("Geometry data of the communities of Catalonia, Madrid, and Canary Islands", async () => {
        const cataloniaGeometryID = "00005858-5800-1200-0000-000077363e04";
        const madridGeometryID = "00005858-5800-1200-0000-0000773645b1";
        const canaryIslandsGeometryID = "00005858-5800-1200-0000-000077364372";

        const result = await geometryData({
            geometries: [cataloniaGeometryID, madridGeometryID, canaryIslandsGeometryID],
            zoom: 10
        });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: cataloniaGeometryID,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.arrayContaining([])
                    }
                },
                {
                    type: "Feature",
                    id: madridGeometryID,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.arrayContaining([])
                    }
                },
                {
                    type: "Feature",
                    id: canaryIslandsGeometryID,
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.arrayContaining([])
                    }
                }
            ]
        });
    });

    test(
        "Geometry data of the communities of Catalonia, Madrid, and Canary Islands " +
            "where Madrid UUID is incorrect and won't be found",
        async () => {
            const cataloniaGeometryID = "00005858-5800-1200-0000-000077363e04";
            const madridGeometryID = "INCORRECT";
            const canaryIslandsGeometryID = "00005858-5800-1200-0000-000077364372";

            const result = await geometryData({
                geometries: [cataloniaGeometryID, madridGeometryID, canaryIslandsGeometryID],
                zoom: 4
            });
            expect(result).toMatchObject({
                type: "FeatureCollection",
                bbox: expect.any(Array),
                features: [
                    {
                        type: "Feature",
                        id: cataloniaGeometryID,
                        bbox: expect.any(Array),
                        properties: {},
                        geometry: {
                            type: "MultiPolygon",
                            coordinates: expect.arrayContaining([])
                        }
                    },
                    {
                        type: "Feature",
                        id: canaryIslandsGeometryID,
                        bbox: expect.any(Array),
                        properties: {},
                        geometry: {
                            type: "MultiPolygon",
                            coordinates: expect.arrayContaining([])
                        }
                    }
                ]
            });
        }
    );

    test("Geometry Data with API response callback", async () => {
        const geometries = ["00004e4c-3100-3c00-0000-000059685013"];
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: GeometryDataResponseAPI) => void;
        const result = await geometryData({ geometries, zoom: 10, onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });
});

describe("Geometry with Places", () => {
    test("Build a geometry response with places properties - integration", async () => {
        const result = await geometryData({ geometries: places as unknown as Places });
        const azoresGeometryId = "a91ae003-75af-4d47-b27f-20947f24ea72";
        const azoresRegion = result?.features.find((feature) => feature.id === azoresGeometryId);

        expect(azoresRegion?.properties).toMatchObject({
            ...places.features[0].properties,
            placeCoordinates: places.features[0].geometry.coordinates
        });
    });
});
