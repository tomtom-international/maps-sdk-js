import type { PolygonFeatures } from '@anw/maps-sdk-js/core';
import { bboxCenter, bboxFromCoordsArray } from '@anw/maps-sdk-js/core';
import type { Feature, FeatureCollection, GeoJsonProperties, MultiPolygon, Point, Polygon, Position } from 'geojson';
import isNil from 'lodash/isNil';
import type { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { SymbolLayerSpecWithoutSource } from '../shared';
import { MAP_BOLD_FONT } from '../shared/layers/commonLayerProps';
import type { ColorPaletteOptions } from './layers/geometryLayers';
import { colorPalettes, geometryFillSpec, geometryOutlineSpec } from './layers/geometryLayers';
import type { GeometriesModuleConfig } from './types/geometriesModuleConfig';
import type { DisplayGeometryProps, ExtraGeometryDisplayProps } from './types/geometryDisplayProps';
import { GEOMETRY_TITLE_PROP } from './types/geometryDisplayProps';

/**
 * Builds Geometry layer specifications for fill and outline layers.
 * @ignore
 */
export const buildGeometryLayerSpecs = (
    fillLayerID: string,
    outlineLayerID: string,
    config?: GeometriesModuleConfig,
): [SymbolLayerSpecWithoutSource, SymbolLayerSpecWithoutSource] => {
    const colorConfig = config?.colorConfig;
    const lineConfig = config?.lineConfig;

    const fillLayerSpec = {
        ...geometryFillSpec,
        id: fillLayerID,
        paint: {
            ...geometryFillSpec.paint,
            ...(!isNil(colorConfig?.fillOpacity) && { 'fill-opacity': colorConfig?.fillOpacity }),
            ...(colorConfig?.fillColor && { 'fill-color': ['get', 'color'] }),
        },
    } as unknown as SymbolLayerSpecWithoutSource;

    const outlineLayerSpec = {
        ...geometryOutlineSpec,
        id: outlineLayerID,
        paint: {
            ...geometryOutlineSpec.paint,
            ...(!isNil(lineConfig?.lineColor) && { 'line-color': lineConfig?.lineColor }),
            ...(!isNil(lineConfig?.lineWidth) && { 'line-width': lineConfig?.lineWidth }),
            ...(!isNil(lineConfig?.lineOpacity) && { 'line-opacity': lineConfig?.lineOpacity }),
        },
    } as unknown as SymbolLayerSpecWithoutSource;

    return [fillLayerSpec, outlineLayerSpec];
};

/**
 * Build geometry Title. The type can be a string or a Maplibre expression.
 * @param feature - Geometry
 * @param config - Geometry module configuration
 * @returns
 */
const buildTitle = (
    feature: Feature<Polygon | MultiPolygon, DisplayGeometryProps | GeoJsonProperties>,
    config: GeometriesModuleConfig,
): DataDrivenPropertyValueSpecification<string> | string | undefined => {
    if (config.textConfig?.textField) {
        return config.textConfig.textField;
    }

    return feature.properties?.address?.freeformAddress;
};

/**
 * Builds a geometry color string or MapLibre expression.
 * @param config - Geometry module configuration
 * @param index - Number to use as index to pick color from palette option
 */
const buildColor = (
    config: GeometriesModuleConfig,
    index: number,
): DataDrivenPropertyValueSpecification<string> | string | undefined => {
    const color = config?.colorConfig?.fillColor;

    if (typeof color === 'string' && colorPalettes[color as ColorPaletteOptions]) {
        const palette = colorPalettes[color as ColorPaletteOptions];
        return palette[index % palette.length];
    }

    return color;
};

/**
 * Build geometry layer specification for title
 * @param layerID
 * @param config
 * @returns
 * @ignore
 */
export const buildGeometryTitleLayerSpec = (
    layerID: string,
    config?: GeometriesModuleConfig,
): Omit<SymbolLayerSpecification, 'source'> => {
    const textConfig = config?.textConfig;

    return {
        type: 'symbol',
        id: layerID,
        layout: {
            'text-field': ['get', GEOMETRY_TITLE_PROP],
            ...(textConfig?.textField && { 'text-field': textConfig.textField }),
            'text-padding': 5,
            'text-size': 12,
            'text-font': [MAP_BOLD_FONT],
            'symbol-placement': 'point',
        },
        paint: {
            'text-color': '#333333',
            'text-halo-color': '#FFFFFF',
            'text-halo-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 1.5],
            'text-translate-anchor': 'viewport',
        },
    };
};

/**
 * Prepare geometry for display.
 * If colorConfig is set, it will apply the property "color" to "properties" in each feature.
 * @param geometry
 * @param config
 * @returns
 * @ignore
 */
export const prepareGeometryForDisplay = (
    geometry: PolygonFeatures<GeoJsonProperties | DisplayGeometryProps>,
    config: GeometriesModuleConfig = {},
): PolygonFeatures<ExtraGeometryDisplayProps> => ({
    ...geometry,
    features: geometry.features.map((feature, index) => {
        const title = feature.properties?.title ? feature.properties.title : buildTitle(feature, config);
        const color = feature.properties?.color ? feature.properties.color : buildColor(config, index);
        return { ...feature, properties: { ...feature.properties, title, color } };
    }),
});

/**
 * Find the biggest array length inside an array.
 * Used to find the biggest array in a Multi-Polygon feature.
 * @param coordinates
 * @returns
 */
const getLongestArray = (coordinates: Position[][][]) =>
    coordinates.flat().reduce((result, coord) => (coord.length > result.length ? coord : result), []);

/**
 * Create a Feature<Point> with coordinates where title will be placed.
 * If feature properties contains a coordinates value, it will use it.
 * In case there is not coordinates value, it will get the biggest Polygon inside a feature and calculate
 * the bounding box for those coordinates and finally calculate the bounding box center to place the title.
 * @param geometries
 * @returns
 * @ignore
 */
export const prepareTitleForDisplay = (geometries: PolygonFeatures<GeoJsonProperties>): FeatureCollection<Point> => {
    const features = geometries.features.map((feature) => {
        let coordinates: Position[] | Position | null;

        if (feature.properties?.placeCoordinates) {
            coordinates = feature.properties?.placeCoordinates;
        } else if (feature.geometry.type === 'MultiPolygon') {
            const biggestPolygon = getLongestArray(feature.geometry.coordinates);
            const bbox = bboxFromCoordsArray(biggestPolygon);
            coordinates = (bbox && bboxCenter(bbox)) || null;
        } else {
            coordinates = feature.geometry.coordinates.flat();
        }

        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: feature.properties,
        } as Feature<Point>;
    });

    return { type: 'FeatureCollection', bbox: geometries.bbox, features };
};
