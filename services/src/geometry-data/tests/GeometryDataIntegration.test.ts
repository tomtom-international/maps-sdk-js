import { geometryData } from "../GeometryData";
import { GOSDKConfig } from "@anw/go-sdk-js/core";

describe("Geometry data errors", () => {
    test("Geometry data test without API key", async () => {
        await expect(geometryData({ geometries: [] })).rejects.toMatchObject({
            service: "GeometryData",
            message: "Request failed with status code 403",
            status: 403
        });
    });
});

describe("Geometry data integration tests", () => {
    beforeAll(() => {
        GOSDKConfig.instance.put({ apiKey: process.env.API_KEY });
    });

    test("Geometry data of Schiphol airport", async () => {
        const result = await geometryData({ geometries: ["00004e4c-3100-3c00-0000-000059685013"] });
        expect(result).toStrictEqual({
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
                        coordinates: expect.any(Array)
                    }
                }
            ]
        });
    });

    test("Geometry data of Spain", async () => {
        const result = await geometryData({ geometries: ["00005858-5800-1200-0000-000077363e00"], zoom: 10 });
        expect(result).toStrictEqual({
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
                        coordinates: expect.any(Array)
                    }
                }
            ]
        });
    });

    test("Geometry data of the communities of Catalonia, Madrid, and Canary Islands", async () => {
        const result = await geometryData({
            geometries: [
                "00005858-5800-1200-0000-000077363e04", // Catalonia
                "00005858-5800-1200-0000-0000773645b1", // Madrid
                "00005858-5800-1200-0000-000077364372" // Canary Islands
            ],
            zoom: 10
        });
        expect(result).toStrictEqual({
            type: "FeatureCollection",
            bbox: expect.any(Array),
            features: [
                {
                    type: "Feature",
                    id: "00005858-5800-1200-0000-000077363e04",
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.any(Array)
                    }
                },
                {
                    type: "Feature",
                    id: "00005858-5800-1200-0000-0000773645b1",
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.any(Array)
                    }
                },
                {
                    type: "Feature",
                    id: "00005858-5800-1200-0000-000077364372",
                    bbox: expect.any(Array),
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: expect.any(Array)
                    }
                }
            ]
        });
    });
});
