import type { Anything, CommonPlaceProps } from '@cet/maps-sdk-js/core';
import type { SupportsEvents } from '../../shared';

/**
 * Extra properties to display color and title for a geometry on the map.
 *
 * Provides customization options for rendering polygon geometries, including
 * visual styling and labeling.
 *
 * @remarks
 * **Use Cases:**
 * - Search result boundaries (e.g., city limits, postal codes)
 * - Reachable range polygons
 * - Delivery zones
 * - Custom area highlights
 *
 * These properties override default styling and allow per-feature customization.
 *
 * @example
 * ```typescript
 * const geometryProps: ExtraGeometryDisplayProps = {
 *   title: 'Amsterdam City Center',
 *   color: '#FF5733',
 *   eventState: 'click'
 * };
 *
 * // With custom properties
 * const customProps: ExtraGeometryDisplayProps = {
 *   title: 'Delivery Zone A',
 *   color: '#00FF00',
 *   zoneId: 'zone-a',
 *   capacity: 100
 * };
 * ```
 *
 * @group Geometry
 * @category Types
 */
export type ExtraGeometryDisplayProps = {
    /**
     * Display title for the geometry.
     *
     * @remarks
     * Optional text label displayed at the center of the polygon.
     * If not provided, no label will be shown.
     *
     * **Common Uses:**
     * - Area names (e.g., "Downtown", "Zone A")
     * - Statistics (e.g., "30 min reachable")
     * - Custom labels
     *
     * @example
     * ```typescript
     * title: 'Amsterdam City Center'
     * title: 'Zone A'
     * title: '30 min driving range'
     * title: undefined  // No label
     * ```
     */
    title?: string;

    /**
     * Fill color for the geometry.
     *
     * @remarks
     * Overrides the default fill color from the module configuration.
     * Accepts any valid CSS color value.
     *
     * **Color Formats:**
     * - Hex: '#FF5733'
     * - RGB: 'rgb(255, 87, 51)'
     * - RGBA: 'rgba(255, 87, 51, 0.5)'
     * - Named: 'red', 'blue', 'green'
     *
     * @example
     * ```typescript
     * color: '#FF5733'
     * color: 'rgb(0, 128, 255)'
     * color: 'rgba(255, 0, 0, 0.5)'
     * color: 'red'
     * ```
     */
    color?: string;
} & SupportsEvents &
    Anything;

/**
 * Geometry base and display properties.
 *
 * Combines complete place information with geometry-specific display properties
 * for rendering polygon features on the map.
 *
 * @remarks
 * Used by the GeometriesModule for rendering:
 * - Search API geometry results
 * - Reachable range polygons
 * - Custom polygon overlays
 * - Administrative boundaries
 *
 * Includes both geographic/metadata and visual styling properties.
 *
 * @example
 * ```typescript
 * const geometry: DisplayGeometryProps = {
 *   type: 'Polygon',
 *   id: 'geom-123',
 *   title: 'Amsterdam',
 *   color: '#0080FF',
 *   address: {
 *     municipalitySubdivision: 'Amsterdam',
 *     countryCode: 'NL'
 *   }
 * };
 * ```
 *
 * @group Geometry
 * @category Types
 */
export type DisplayGeometryProps = CommonPlaceProps & ExtraGeometryDisplayProps;

/**
 * @ignore
 */
export const GEOMETRY_TITLE_PROP = 'title';

/**
 * @ignore
 */
export const GEOMETRY_COLOR_PROP = 'color';
