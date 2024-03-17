import type { DataDrivenPropertyValueSpecification } from "maplibre-gl";
import type { ColorPaletteOptions } from "../layers/geometryLayers";
import type { MapStyleLayerID } from "../../shared";

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
 * Geometry layer position config. This option allows you to move the geometry layer position below a pre-defined layer.
 */
export type GeometryBeforeLayerConfig = "top" | MapStyleLayerID;

/**
 * Geometry layer configuration
 */
export type GeometriesModuleConfig = {
    colorConfig?: GeometryColorConfig;
    textConfig?: GeometryTextConfig;
    lineConfig?: GeometryLineConfig;
    beforeLayerConfig?: GeometryBeforeLayerConfig;
};
