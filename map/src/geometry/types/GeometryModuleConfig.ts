import { DataDrivenPropertyValueSpecification } from "maplibre-gl";
import {
    BELOW_ALL_LABELS_LAYER_ID,
    BELOW_COUNTRIES_LAYER_ID,
    BELOW_PLACE_LABELS_LAYER_ID,
    BELOW_PLACE_LAYER_ID,
    BELOW_ROADS_LAYER_ID,
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
     * Position the geometry layer below the geometry title layer ("geometry_Title").
     */
    top: GEOMETRY_TITLE_LAYER_ID,
    /**
     * Position the geometry layer below the countries defined layer ("Places - Country name").
     */
    belowCountries: BELOW_COUNTRIES_LAYER_ID,
    /**
     * Position the geometry layer below all labels layer ("Borders - Treaty label").
     */
    belowAllLabels: BELOW_ALL_LABELS_LAYER_ID,
    /**
     * Position the geometry layer below place labels layer ("Places - Village / Hamlet").
     */
    belowPlaceLabels: BELOW_PLACE_LABELS_LAYER_ID,
    /**
     * Position the geometry layer below place layer ("POI").
     */
    belowMapPOIs: BELOW_PLACE_LAYER_ID,
    /**
     * Position the geometry layer below road layer ("Tunnel - Railway outline").
     */
    belowRoads: BELOW_ROADS_LAYER_ID
} as const;

/**
 * Geometry layer position config. This option allows you to move the geometry layer position to below a pre-defined layer options
 * Options are:
 * * top - Position the geometry layer just below the geometry title layer ("geometry_Title").
 * * belowCountries -  Position the geometry layer below the countries defined layer ("Places - Country name").
 * * belowAllLabels - Position the geometry layer below all labels layer ("Borders - Treaty label").
 * * belowPlaceLabels - Position the geometry layer below place labels layer ("Places - Village / Hamlet").
 * * belowMapPOIs - Position the geometry layer below place layer ("POI").
 * * belowRoads - Position the geometry layer below road layer ("Tunnel - Railway outline").
 * * belowStraightLabels - Position the geometry layer below the first layer type "symbol" with "symbol-placement" point.
 */
export type GeometryLayerPositionConfig = keyof typeof GeometryLayerPositionOptions | "belowStraightLabels";

/**
 * Geometry layer configuration
 */
export type GeometryModuleConfig = {
    colorConfig?: GeometryColorConfig;
    textConfig?: GeometryTextConfig;
    lineConfig?: GeometryLineConfig;
    layerPosition?: GeometryLayerPositionConfig;
};
