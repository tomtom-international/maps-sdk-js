import {
    bboxCenter,
    bboxFromCoordsArray,
    generateId,
    type PolygonFeature,
    PolygonFeatures,
} from '@tomtom-org/maps-sdk/core';
import { mask } from '@turf/turf';
import type { Feature, FeatureCollection, GeoJsonProperties, MultiPolygon, Point, Polygon, Position } from 'geojson';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import { type ColorPaletteOptions, colorPalettes } from './layers/colorPalettes';
import type { GeometriesModuleConfig } from './types/geometriesModuleConfig';
import type { DisplayGeometryProps, ExtraGeometryDisplayProps } from './types/geometryDisplayProps';
import type { GeometryTheme } from './types/geometryTheme';

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

/** Finds the longest coordinate array in a MultiPolygon for title placement. */
const getLongestArray = (coordinates: Position[][][]) =>
    coordinates.flat().reduce((result, coord) => (coord.length > result.length ? coord : result), []);

/**
 * Converts a polygon into a world-minus-polygon donut for the `'inverted'` theme.
 *
 * Uses `turf.mask` to punch the polygon as a hole in a world bounding box.
 *
 * @remarks
 * Called automatically when a feature or config has `theme: 'inverted'`.
 *
 * @group Geometries
 */
export const invertFeature = (feature: PolygonFeature): PolygonFeature => {
    const masked = mask(feature);
    return {
        ...feature,
        geometry: masked.geometry,
    } as PolygonFeature;
};

type InputFeatureProps = {
    theme?: GeometryTheme;
    title?: string;
    color?: string;
    id?: string;
};
/**
 * Prepares polygon features for display by applying theme, colors, and titles.
 *
 * @param geometry - Polygon features to prepare.
 * @param config - Module configuration for styling.
 * @returns Processed features ready for MapLibre rendering.
 * @ignore
 */
export const prepareGeometryForDisplay = (
    geometry: PolygonFeatures<GeoJsonProperties | DisplayGeometryProps>,
    config: GeometriesModuleConfig = {},
): PolygonFeatures<ExtraGeometryDisplayProps> => ({
    ...geometry,
    features: geometry.features.map((feature, index) => {
        const props = (feature.properties ?? {}) as InputFeatureProps;
        const effectiveTheme = props.theme ?? config.theme;
        const processedFeature = effectiveTheme === 'inverted' ? invertFeature(feature as PolygonFeature) : feature;
        const processedProps = (processedFeature.properties ?? {}) as InputFeatureProps;
        // buildTitle/buildColor may return MapLibre expressions; cast since output type expects string
        const title = (processedProps.title ?? buildTitle(processedFeature, config)) as string | undefined;
        const color = (processedProps.color ?? buildColor(config, index)) as string | undefined;
        return {
            ...processedFeature,
            properties: {
                ...processedFeature.properties,
                ...(effectiveTheme && { theme: effectiveTheme }),
                ...(title && { title }),
                ...(color && { color }),
                id: processedProps.id ?? generateId(),
            },
        };
    }),
});

/**
 * Create a Feature<Point> with coordinates where title will be placed.
 * If feature properties contains a coordinates value, it will use it.
 * In case there is not coordinates value, it will get the biggest Polygon inside a feature and calculate
 * the bounding box for those coordinates and finally calculate the bounding box center to place the title.
 * @param geometries
 * @returns
 * @ignore
 */
export const prepareTitleForDisplay = (geometries: PolygonFeatures): FeatureCollection<Point> => {
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

        const id = feature.id ?? feature.properties?.id ?? generateId();
        return {
            type: 'Feature',
            id,
            geometry: { type: 'Point', coordinates },
            properties: {
                ...feature.properties,
                id, // we need id in properties due to promoteId feature
            },
        } as Feature<Point>;
    });

    return { type: 'FeatureCollection', bbox: geometries.bbox, features };
};
