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
        const result = await geometryData({ geometries: ["1162304972"] });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: "1162304972",
                    properties: {},
                    bbox: expect.any(Array),
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.arrayContaining([])
                    }
                }
            ]
        });
    });

    test("Geometry data of Spain", async () => {
        const result = await geometryData({ geometries: ["1284393703"], zoom: 5 });
        expect(result).toMatchObject({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: "1284393703",
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
        const cataloniaGeometryID = "1251563328";
        const madridGeometryID = "1213671370";
        const canaryIslandsGeometryID = "1174938150";

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
                        type: "Polygon",
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
            const cataloniaGeometryID = "1251563328";
            const madridGeometryID = "INCORRECT";
            const canaryIslandsGeometryID = "1174938150";

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
        const geometries = ["1251563328"];
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: GeometryDataResponseAPI) => void;
        const result = await geometryData({ geometries, zoom: 10, onAPIRequest, onAPIResponse });
        expect(result).toBeDefined();
        expect(result.features.length).toBeGreaterThan(0);
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test("Geometry Data with API error response callback", async () => {
        const geometries = ["1251563328"];
        const onAPIRequest = jest.fn() as (request: URL) => void;
        const onAPIResponse = jest.fn() as (request: URL, response: GeometryDataResponseAPI) => void;
        await expect(() =>
            geometryData({
                geometries,
                zoom: -1,
                validateRequest: false,
                onAPIRequest,
                onAPIResponse
            })
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onAPIRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onAPIResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});

describe("Geometry with Places", () => {
    test("Build a geometry response with places properties - integration", async () => {
        const result = await geometryData({ geometries: places as unknown as Places });
        const azoresGeometryId = "1238932136";
        const azoresRegion = result?.features.find((feature) => feature.id === azoresGeometryId);

        expect(azoresRegion?.properties).toMatchObject({
            ...places.features[0].properties,
            placeCoordinates: places.features[0].geometry.coordinates
        });
    });
});
