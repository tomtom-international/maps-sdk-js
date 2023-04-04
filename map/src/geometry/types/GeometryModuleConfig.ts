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
 * Geometry layer position options
 *  */
export const GeometryLayerPositionOptions = {
    top: GEOMETRY_TITLE_LAYER_ID,
    "bellow-countries": BELLOW_COUNTRIES_LAYER_ID,
    "bellow-all-labels": BELLOW_ALL_LABELS_LAYER_ID
} as const;

/**
 * Geometry layer position config
 */
export type GeometryLayerPositionConfig = keyof typeof GeometryLayerPositionOptions | "bellow-straight-labels";

/**
 * Geometry layer configuration
 */
export type GeometryModuleConfig = {
    colorConfig?: GeometryColorConfig;
    textConfig?: GeometryTextConfig;
    lineConfig?: GeometryLineConfig;
    layerPosition?: GeometryLayerPositionConfig;
};
