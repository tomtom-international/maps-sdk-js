import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import type { MapStyleLayerID } from '../../shared';
import type { ColorPaletteOptions } from '../layers/geometryLayers';

/**
 * Color configuration for geometry fill styling.
 *
 * Controls the fill color and opacity of polygon geometries displayed on the map.
 *
 * @example
 * ```typescript
 * // Solid color with opacity
 * const colorConfig: GeometryColorConfig = {
 *   fillColor: '#FF5733',
 *   fillOpacity: 0.3
 * };
 *
 * // Using color palette
 * const paletteConfig: GeometryColorConfig = {
 *   fillColor: 'red',  // Color palette name
 *   fillOpacity: 0.25
 * };
 *
 * // Data-driven color based on properties
 * const dynamicConfig: GeometryColorConfig = {
 *   fillColor: ['match', ['get', 'type'], 'residential', '#FFEB3B', 'commercial', '#2196F3', '#E0E0E0'],
 *   fillOpacity: 0.4
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryColorConfig = {
    /**
     * Fill color for the geometry.
     *
     * @remarks
     * Can be:
     * - Hex color string (e.g., `'#FF5733'`)
     * - Color palette name (e.g., `'red'`, `'blue'`)
     * - MapLibre expression for data-driven styling
     *
     * @default '#0080FF'
     *
     * @example
     * ```typescript
     * // Hex color
     * fillColor: '#FF5733'
     *
     * // Palette name
     * fillColor: 'red'
     *
     * // MapLibre expression
     * fillColor: ['get', 'color']
     *
     * // Conditional coloring
     * fillColor: ['case', ['>', ['get', 'area'], 10000], '#FF0000', '#00FF00']
     * ```
     */
    fillColor?: ColorPaletteOptions | DataDrivenPropertyValueSpecification<string>;

    /**
     * Opacity of the fill color.
     *
     * @remarks
     * Value between 0 (fully transparent) and 1 (fully opaque).
     *
     * @default 0.3
     *
     * @example
     * ```typescript
     * fillOpacity: 0.5  // 50% transparent
     *
     * // Data-driven opacity
     * fillOpacity: ['interpolate', ['linear'], ['get', 'importance'], 1, 0.8, 10, 0.3]
     * ```
     */
    fillOpacity?: DataDrivenPropertyValueSpecification<number>;
};

/**
 * Text label configuration for geometries.
 *
 * Controls text labels displayed at the center of polygon geometries.
 *
 * @example
 * ```typescript
 * // Simple text field
 * const textConfig: GeometryTextConfig = {
 *   textField: ['get', 'name']
 * };
 *
 * // Conditional text
 * const conditionalText: GeometryTextConfig = {
 *   textField: ['case', ['has', 'title'], ['get', 'title'], ['get', 'id']]
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryTextConfig = {
    /**
     * Text content to display as label.
     *
     * @remarks
     * Must be a MapLibre expression that evaluates to a string.
     * Labels are positioned at the geometry's center point.
     *
     * @example
     * ```typescript
     * // Display feature property
     * textField: ['get', 'name']
     *
     * // Concatenate properties
     * textField: ['concat', ['get', 'name'], ' (', ['get', 'area'], ' km²)']
     *
     * // Conditional text
     * textField: ['case', ['has', 'label'], ['get', 'label'], '']
     * ```
     */
    textField: DataDrivenPropertyValueSpecification<string>;
};

/**
 * Line/border configuration for geometries.
 *
 * Controls the outline appearance of polygon geometries.
 *
 * @example
 * ```typescript
 * // Basic border
 * const lineConfig: GeometryLineConfig = {
 *   lineColor: '#333333',
 *   lineWidth: 2,
 *   lineOpacity: 0.8
 * };
 *
 * // Data-driven border
 * const dynamicLine: GeometryLineConfig = {
 *   lineColor: ['get', 'borderColor'],
 *   lineWidth: ['case', ['get', 'selected'], 4, 2],
 *   lineOpacity: 1
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometryLineConfig = {
    /**
     * Color of the geometry border/outline.
     *
     * @default '#0080FF'
     *
     * @example
     * ```typescript
     * lineColor: '#333333'
     * lineColor: ['get', 'borderColor']
     * ```
     */
    lineColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Opacity of the border line.
     *
     * @remarks
     * Value between 0 (fully transparent) and 1 (fully opaque).
     *
     * @default 1
     *
     * @example
     * ```typescript
     * lineOpacity: 0.8
     * ```
     */
    lineOpacity?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Width of the border line in pixels.
     *
     * @default 2
     *
     * @example
     * ```typescript
     * lineWidth: 3
     *
     * // Highlight selected geometries
     * lineWidth: ['case', ['get', 'selected'], 4, 2]
     * ```
     */
    lineWidth?: DataDrivenPropertyValueSpecification<number>;
};

/**
 * Layer positioning configuration for geometries.
 *
 * Controls where geometry layers are placed in the map's layer stack.
 *
 * @remarks
 * Use this to ensure geometries appear above or below other map features like
 * labels, roads, or other data layers.
 *
 * @example
 * ```typescript
 * // Place on top of all layers
 * const beforeLayer: GeometryBeforeLayerConfig = 'top';
 *
 * // Place below labels
 * const beforeLayer: GeometryBeforeLayerConfig = 'lowestLabel';
 * ```
 *
 * @group Geometries
 */
export type GeometryBeforeLayerConfig = 'top' | MapStyleLayerID;

/**
 * Configuration options for the GeometriesModule.
 *
 * Controls the visual appearance and positioning of polygon geometries displayed on the map.
 *
 * @example
 * ```typescript
 * // Basic styling
 * const config: GeometriesModuleConfig = {
 *   colorConfig: {
 *     fillColor: '#FF5733',
 *     fillOpacity: 0.3
 *   },
 *   lineConfig: {
 *     lineColor: '#C70039',
 *     lineWidth: 2
 *   }
 * };
 *
 * // With labels and positioning
 * const advancedConfig: GeometriesModuleConfig = {
 *   colorConfig: {
 *     fillColor: 'blue',
 *     fillOpacity: 0.25
 *   },
 *   lineConfig: {
 *     lineColor: 'darkblue',
 *     lineWidth: 3
 *   },
 *   textConfig: {
 *     textField: ['get', 'name']
 *   },
 *   beforeLayerConfig: 'lowestLabel'  // Below map labels
 * };
 *
 * // Data-driven styling
 * const dynamicConfig: GeometriesModuleConfig = {
 *   colorConfig: {
 *     fillColor: ['match', ['get', 'category'], 'park', '#4CAF50', 'water', '#2196F3', '#9E9E9E'],
 *     fillOpacity: 0.4
 *   },
 *   lineConfig: {
 *     lineColor: '#000000',
 *     lineWidth: ['case', ['get', 'highlighted'], 4, 2]
 *   },
 *   textConfig: {
 *     textField: ['concat', ['get', 'name'], '\n', ['get', 'area'], ' km²']
 *   }
 * };
 * ```
 *
 * @group Geometries
 */
export type GeometriesModuleConfig = {
    /**
     * Fill color and opacity configuration.
     *
     * Controls the interior color and transparency of polygon geometries.
     */
    colorConfig?: GeometryColorConfig;

    /**
     * Text label configuration.
     *
     * Controls labels displayed at geometry center points.
     */
    textConfig?: GeometryTextConfig;

    /**
     * Border/outline configuration.
     *
     * Controls the outline appearance of polygon geometries.
     */
    lineConfig?: GeometryLineConfig;

    /**
     * Layer positioning configuration.
     *
     * Controls where geometry layers appear in the map's layer stack.
     * Use `'top'` to place above all layers, or specify a layer ID to place
     * below that layer.
     *
     * @example
     * ```typescript
     * // On top of everything
     * beforeLayerConfig: 'top'
     *
     * // Below map labels
     * beforeLayerConfig: 'lowestLabel'
     *
     * // Below POI layer
     * beforeLayerConfig: 'POI'
     * ```
     */
    beforeLayerConfig?: GeometryBeforeLayerConfig;
};
