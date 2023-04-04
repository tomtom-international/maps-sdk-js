import { DataDrivenPropertyValueSpecification } from "maplibre-gl";
import {
    BELLOW_ALL_LABELS_LAYER_ID,
    BELLOW_COUNTRIES_LAYER_ID,
    ColorPaletteOptions,
    GEOMETRY_TITLE_LAYER_ID
} from "../layers/GeometryLayers";

/**
 * Places Color configuration
 */
export type GeometryColorConfig = {
    /**
     * fillColor could be a string with hex color value or the name of a color palette or a valid MapLibre expression to be used directly
     */
    fillColor?: ColorPaletteOptions | DataDrivenPropertyValueSpecification<string>;
    fillOpacity?: DataDrivenPropertyValueSpecification<number>;
};

/**
 * Geometry text configuration
 */
export type GeometryTextConfig = {
    textField: DataDrivenPropertyValueSpecification<string>;
};

/**
 * Geometry line configuration
 */
export type GeometryLineConfig = {
    lineColor?: DataDrivenPropertyValueSpecification<string>;
    lineOpacity?: DataDrivenPropertyValueSpecification<number>;
    lineWidth?: DataDrivenPropertyValueSpecification<number>;
};

/**
 * Geometry layer position options.
 */
export const GeometryLayerPositionOptions = {
    /**
     * Position the geometry layer bellow the geometry title layer ("geometry_Title").
     */
    top: GEOMETRY_TITLE_LAYER_ID,
    /**
     * Position the geometry layer bellow the countries defined layer ("Borders - Treaty label").
     */
    bellowCountries: BELLOW_COUNTRIES_LAYER_ID,
    /**
     * Position the geometry layer bellow all labels layer ("Buildings - Underground")
     */
    bellowAllLabels: BELLOW_ALL_LABELS_LAYER_ID
} as const;

/**
 * Geometry layer position config. This option allows you to move the geometry layer position to bellow a pre-defined layer options
 * Options are:
 * * top - Position the geometry layer just bellow the geometry title layer ("geometry_Title").
 * * bellowCountries - Position the geometry layer bellow the countries defined layer ("Borders - Treaty label").
 * * bellowAllLabels - Position the geometry layer bellow all labels layer ("Buildings - Underground").
 * * bellowStraightLabels - Position the geometry layer bellow the first layer type "symbol" with "symbol-placement" point.
 */
export type GeometryLayerPositionConfig = keyof typeof GeometryLayerPositionOptions | "bellowStraightLabels";

/**
 * Geometry layer configuration
 */
export type GeometryModuleConfig = {
    colorConfig?: GeometryColorConfig;
    textConfig?: GeometryTextConfig;
    lineConfig?: GeometryLineConfig;
    layerPosition?: GeometryLayerPositionConfig;
};
