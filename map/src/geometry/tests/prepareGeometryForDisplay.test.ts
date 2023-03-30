import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { ColorPaletteOptions, colorPalettes } from "../layers/GeometryLayers";
import {
    buildGeometryLayerSpec,
    buildGeometryTitleLayerSpec,
    prepareGeometryForDisplay,
    prepareTitleForDisplay
} from "../prepareGeometryForDisplay";
import { GeometryModuleConfig } from "../types/GeometryModuleConfig";

describe("prepareGeometryForDisplay", () => {
    test("Build geometry spec layer", () => {
        const config: GeometryModuleConfig = {
            colorConfig: {
                fillOpacity: 1,
                fillColor: "#00ffaa"
            },
            lineConfig: {
                lineColor: "#00ffbb",
                lineWidth: 2,
                lineOpacity: 0.3
            }
        };

        const [fillLayerSpec, outLineLayerSpec] = buildGeometryLayerSpec(config);

        expect(fillLayerSpec).toMatchObject({
            type: "fill",
            paint: {
                "fill-color": ["get", "color"],
                "fill-opacity": config.colorConfig?.fillOpacity,
                "fill-antialias": false
            }
        });

        expect(outLineLayerSpec).toMatchObject({
            type: "line",
            paint: {
                "line-color": config.lineConfig?.lineColor,
                "line-opacity": config.lineConfig?.lineOpacity,
                "line-width": config.lineConfig?.lineWidth
            }
        });
    });

    test("Build geometry title spec layer", () => {
        const GEOMETRY_TITLE_SOURCE_ID = "GEOMETRY_TITLE_SOURCE";
        let config: GeometryModuleConfig = {
            textConfig: {
                textField: "title"
            }
        };

        let geometryTitleSpec = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_SOURCE_ID, config);

        expect(geometryTitleSpec).toHaveProperty("id", GEOMETRY_TITLE_SOURCE_ID);
        expect(geometryTitleSpec.layout).toHaveProperty("text-field", ["get", config.textConfig?.textField]);

        // Using Maplibre expressions
        config = {
            textConfig: {
                textField: ["get", "name"]
            }
        };

        geometryTitleSpec = buildGeometryTitleLayerSpec(GEOMETRY_TITLE_SOURCE_ID, config);
        expect(geometryTitleSpec.layout).toHaveProperty("text-field", config.textConfig?.textField);
    });

    test("Prepare geometry for display", () => {
        const geometry: FeatureCollection<Polygon> = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {
                        title: "TomTom"
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: []
                    }
                },
                {
                    type: "Feature",
                    properties: {
                        address: {
                            freeformAddress: "TomTom"
                        },
                        color: "#00aabb"
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: []
                    }
                }
            ]
        };

        const config: GeometryModuleConfig = {
            colorConfig: {
                fillColor: "warm"
            }
        };

        const results = prepareGeometryForDisplay(geometry, config);

        expect(results.features[0].properties).toHaveProperty("color");
        expect(colorPalettes[config.colorConfig?.fillColor as ColorPaletteOptions]).toContain(
            results.features[0].properties?.color
        );
        expect(results.features[0].properties).toHaveProperty("title", "TomTom");
        expect(results.features[1].properties).toHaveProperty("title", "TomTom");
        expect(results.features[1].properties).toHaveProperty("color", "#00aabb");
    });

    test("Prepare title for display", () => {
        const geometries: FeatureCollection<Polygon | MultiPolygon> = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [[[-7.1036325, 43.4264427]]]
                    }
                },
                {
                    type: "Feature",
                    properties: {
                        placeCoordinates: [[-7.1036325, 43.4264427]]
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: []
                    }
                },
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "MultiPolygon",
                        coordinates: [
                            [
                                [
                                    [102.0, 2.0],
                                    [103.0, 2.0],
                                    [103.0, 3.0],
                                    [102.0, 3.0],
                                    [102.0, 2.0]
                                ]
                            ],
                            [
                                [
                                    [100.0, 0.0],
                                    [101.0, 0.0],
                                    [101.0, 1.0],
                                    [100.0, 1.0],
                                    [100.0, 0.0]
                                ],
                                [
                                    [100.2, 0.2],
                                    [100.8, 0.2],
                                    [100.8, 0.8],
                                    [100.2, 0.8],
                                    [100.2, 0.2]
                                ]
                            ]
                        ]
                    }
                }
            ]
        };

        expect(prepareTitleForDisplay(geometries)).toMatchObject({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [[-7.1036325, 43.4264427]] },
                    properties: {}
                },
                {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [[-7.1036325, 43.4264427]] },
                    properties: { placeCoordinates: [[-7.1036325, 43.4264427]] }
                },
                { type: "Feature", geometry: { type: "Point", coordinates: [102.5, 2.5] }, properties: {} }
            ]
        });
    });
});
