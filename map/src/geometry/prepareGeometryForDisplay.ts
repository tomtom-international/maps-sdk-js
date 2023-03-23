import { FeatureCollection, Feature, MultiPolygon, Point, Polygon, Position } from "geojson";
import { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { bboxCenter, bboxFromCoordsArray } from "@anw/maps-sdk-js/core";
import { ColorPaletteOptions, ColorPalettes, geometryFillSpec, geometryOutlineSpec } from "./layers/GeometryLayers";
import { GeometryModuleConfig } from "./types/GeometryModuleConfig";

export const pickRandomColor = (palette: ColorPaletteOptions): string =>
    ColorPalettes[palette][Math.floor(Math.random() * ColorPalettes[palette].length)];

export const buildGeometryFillColor = (fillColor: DataDrivenPropertyValueSpecification<string>) =>
    typeof fillColor === "string" && fillColor in ColorPalettes
        ? pickRandomColor(fillColor as ColorPaletteOptions)
        : fillColor;

export const buildGeometryLayerSpec = (config?: GeometryModuleConfig) => {
    const colorConfig = config?.colorConfig;
    const lineConfig = config?.lineConfig;

    const fillLayerSpec = {
        ...geometryFillSpec,
        paint: {
            ...geometryFillSpec.paint,
            ...(colorConfig?.fillOpacity && { "fill-opacity": colorConfig.fillOpacity }),
            ...(colorConfig?.fillColor && { "fill-color": ["get", "color"] })
        }
    };

    const outlineLayerSpec = {
        ...geometryOutlineSpec,
        paint: {
            ...geometryOutlineSpec.paint,
            ...(lineConfig?.lineColor && { "line-color": lineConfig.lineColor }),
            ...(lineConfig?.lineWidth && { "line-width": lineConfig.lineWidth }),
            ...(lineConfig?.lineOpacity && { "line-opacity": lineConfig.lineOpacity })
        }
    };

    return [fillLayerSpec, outlineLayerSpec];
};

const buildGeometryTitle = (
    textField: DataDrivenPropertyValueSpecification<string>
): DataDrivenPropertyValueSpecification<string> => {
    if (typeof textField === "string") {
        return ["get", textField];
    }

    return textField;
};

export const buildGeometryTitleLayerSpec = (
    layerID: string,
    config?: GeometryModuleConfig
): Omit<SymbolLayerSpecification, "source"> => {
    const textConfig = config?.textConfig;

    return {
        type: "symbol",
        id: layerID,
        layout: {
            "text-field": ["get", "freeformAddress"],
            ...(textConfig?.textField && { "text-field": buildGeometryTitle(textConfig.textField) }),
            "text-padding": 5,
            "text-size": 12,
            "text-font": ["Noto-Bold"],
            "symbol-placement": "point"
        },
        paint: {
            "text-color": "#333333",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 10, 1.5],
            "text-translate-anchor": "viewport"
        }
    };
};

export const prepareGeometryForDisplay = (
    geometry: FeatureCollection<Polygon | MultiPolygon>,
    config?: GeometryModuleConfig
): FeatureCollection<Polygon | MultiPolygon> => {
    const colorConfig = config?.colorConfig;
    if (colorConfig && colorConfig.fillColor) {
        geometry.features.forEach((feature) => {
            feature.properties = {
                ...feature.properties,
                // @ts-ignore
                color: buildGeometryFillColor(colorConfig.fillColor)
            };
        });
    }

    return geometry;
};

const getBiggestArrayLength = (coordinates: Position[][][]) =>
    coordinates.flat().reduce((result, coord) => (coord.length > result.length ? coord : result), []);

export const prepareTitleForDisplay = (
    geometries: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Point> => {
    const features = geometries.features.map((feature) => {
        let coordinates: Position[] | Position | null;

        if (feature.properties?.coordinates) {
            coordinates = feature.properties?.coordinates;
        } else if (feature.geometry.type === "MultiPolygon") {
            const biggestPolygon = getBiggestArrayLength(feature.geometry.coordinates);
            const bbox = bboxFromCoordsArray(biggestPolygon);
            coordinates = (bbox && bboxCenter(bbox)) || null;
        } else {
            coordinates = feature.geometry.coordinates.flat();
        }

        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates
            },
            properties: feature.properties
        } as Feature<Point>;
    });

    return {
        type: "FeatureCollection",
        bbox: geometries.bbox,
        features
    };
};
