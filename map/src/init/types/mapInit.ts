import type { GlobalConfig } from '@cet/maps-sdk-js/core';
import type { MapOptions, StyleSpecification } from 'maplibre-gl';
import type { MapEventsConfig } from './mapEventsConfig';

export const standardStyleIDs = [
    'standardLight',
    'standardDark',
    // TODO: driving styles not supported in Orbis for now
    'drivingLight',
    'drivingDark',
    'monoLight',
    'monoDark',
    'satellite',
] as const;

/**
 * Identifier for a TomTom-hosted standard map style.
 *
 * Standard styles are officially maintained by TomTom and provide consistent,
 * professionally designed map appearances.
 *
 * @remarks
 * Available styles:
 * - `standardLight`: Default light theme with full detail
 * - `standardDark`: Dark theme for low-light environments
 * - `drivingLight`: Optimized for in-car navigation (light)
 * - `drivingDark`: Optimized for in-car navigation (dark)
 * - `monoLight`: Minimalist monochrome light theme
 * - `monoDark`: Minimalist monochrome dark theme
 * - `satellite`: Satellite imagery basemap
 *
 * @example
 * ```typescript
 * const styleId: StandardStyleID = 'standardLight';
 * ```
 *
 * @group Map Style
 */
export type StandardStyleID = (typeof standardStyleIDs)[number];

/**
 * Configuration for a TomTom standard map style.
 *
 * Provides options to customize which modules are included and which style version to use.
 *
 * @example
 * ```typescript
 * // Standard style with all default modules
 * const style: StandardStyle = {
 *   id: 'standardLight'
 * };
 *
 * // Exclude traffic modules
 * const styleNoTraffic: StandardStyle = {
 *   id: 'standardLight',
 *   include: ['hillshade']  // Only include hillshade, exclude traffic
 * };
 *
 * // Use specific style version
 * const versionedStyle: StandardStyle = {
 *   id: 'standardDark',
 *   version: '1.0.0'
 * };
 * ```
 *
 * @group Map Style
 */
export type StandardStyle = {
    /**
     * Standard style identifier.
     *
     * Determines the visual appearance of the map.
     */
    id?: StandardStyleID;
    /**
     * Modules to include when loading the style.
     *
     * If not specified, all available modules are included by default.
     * Use this to selectively enable only needed modules for better performance.
     *
     * @remarks
     * Available modules:
     * - `trafficIncidents`: Real-time traffic incidents (accidents, closures)
     * - `trafficFlow`: Real-time traffic flow visualization
     * - `hillshade`: Terrain elevation shading
     *
     * @example
     * ```typescript
     * // Include only traffic modules
     * include: ['trafficIncidents', 'trafficFlow']
     *
     * // Include only hillshade
     * include: ['hillshade']
     * ```
     */
    include?: StyleModule[];
    /**
     * Style version to load.
     *
     * Allows pinning to a specific style version for consistency.
     * If not specified, uses the latest SDK-supported version.
     *
     * @default Latest SDK-supported version
     *
     * @example
     * ```typescript
     * version: '1.0.0'
     * ```
     */
    version?: string;
};

/**
 * Configuration for a custom map style.
 *
 * Allows using your own map style either via URL or direct JSON specification.
 *
 * @remarks
 * Use custom styles for:
 * - Branded map appearances
 * - Specialized use cases (indoor maps, thematic maps)
 * - Integration with custom tile servers
 *
 * @example
 * ```typescript
 * // Load from URL
 * const urlStyle: CustomStyle = {
 *   url: 'https://example.com/my-custom-style.json'
 * };
 *
 * // Direct JSON specification
 * const jsonStyle: CustomStyle = {
 *   json: {
 *     version: 8,
 *     sources: { ... },
 *     layers: [ ... ]
 *   }
 * };
 * ```
 *
 * @group Map Style
 */
export type CustomStyle = {
    /**
     * URL to a MapLibre/Mapbox style JSON.
     *
     * The URL should not include the API key - it will be automatically added.
     * Mutually exclusive with the `json` property.
     *
     * @example
     * ```typescript
     * url: 'https://api.tomtom.com/style/1/style/my-custom-style'
     * ```
     */
    url?: string;
    /**
     * Direct style specification as JSON.
     *
     * Provide the complete MapLibre Style Specification object.
     * Mutually exclusive with the `url` property.
     *
     * @see [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/)
     *
     * @example
     * ```typescript
     * json: {
     *   version: 8,
     *   sources: {
     *     'my-source': { type: 'vector', url: '...' }
     *   },
     *   layers: [
     *     { id: 'background', type: 'background', paint: { 'background-color': '#f0f0f0' } }
     *   ]
     * }
     * ```
     */
    json?: StyleSpecification;
};

/**
 * Optional map modules that can be included with a style.
 *
 * @remarks
 * - `trafficIncidents`: Shows real-time traffic incidents on the map
 * - `trafficFlow`: Shows real-time traffic flow with color-coded speeds
 * - `hillshade`: Adds terrain elevation shading for topographic context
 *
 * @group Map Style
 */
export type StyleModule = 'trafficIncidents' | 'trafficFlow' | 'hillshade';

/**
 * Map style specification for initialization.
 *
 * Defines which map style to load and how it should be configured.
 * Supports standard TomTom styles or custom styles.
 *
 * @remarks
 * Three input formats:
 * 1. **Simple ID**: Just pass a standard style ID string
 * 2. **Standard style object**: Use a TomTom style with custom configuration
 * 3. **Custom style object**: Load your own style from URL or JSON
 *
 * @example
 * ```typescript
 * // 1. Simple standard style
 * style: 'standardLight'
 *
 * // 2. Standard style with configuration
 * style: {
 *   type: 'standard',
 *   id: 'standardLight',
 *   include: ['trafficFlow', 'hillshade']
 * }
 *
 * // 3. Custom style from URL
 * style: {
 *   type: 'custom',
 *   url: 'https://example.com/style.json'
 * }
 *
 * // 4. Custom style from JSON
 * style: {
 *   type: 'custom',
 *   json: { version: 8, sources: {...}, layers: [...] }
 * }
 * ```
 *
 * @group Map Style
 */
export type StyleInput = StandardStyleID | (StandardStyle & { type: 'standard' }) | (CustomStyle & { type: 'custom' });

/**
 * Parameters for initializing a TomTom map instance.
 *
 * Combines global SDK configuration with map-specific settings like style and events.
 *
 * @example
 * ```typescript
 * const mapParams: TomTomMapParams = {
 *   key: 'your-api-key',
 *   container: 'map-container',
 *   center: [4.9041, 52.3676],
 *   zoom: 12,
 *   style: 'standardLight',
 *   eventsConfig: {
 *     onClick: (event) => console.log('Map clicked', event)
 *   }
 * };
 * ```
 *
 * @group Map
 */
export type TomTomMapParams = GlobalConfig & {
    /**
     * Map style to load.
     *
     * If not specified, defaults to 'standardLight'.
     *
     * @default 'standardLight'
     *
     * @example
     * ```typescript
     * // Use dark theme
     * style: 'standardDark'
     *
     * // Custom configuration
     * style: {
     *   type: 'standard',
     *   id: 'standardLight',
     *   include: ['trafficFlow']
     * }
     * ```
     */
    style?: StyleInput;

    /**
     * Event handler configuration for map interactions.
     *
     * Define callbacks for various map events like clicks, hovers, and movements.
     *
     * @example
     * ```typescript
     * eventsConfig: {
     *   onClick: (event) => {
     *     console.log('Clicked at', event.lngLat);
     *   },
     *   onMoveEnd: () => {
     *     console.log('Map moved to', map.getCenter());
     *   }
     * }
     * ```
     */
    eventsConfig?: MapEventsConfig;
};

/**
 * MapLibre-specific options for advanced map configuration.
 *
 * Extends MapLibre GL JS MapOptions, excluding style and attribution control
 * which are handled by the TomTom SDK.
 *
 * @remarks
 * Includes options for:
 * - Initial viewport (center, zoom, bearing, pitch)
 * - Interaction controls (zoom, rotation, drag)
 * - Rendering options (antialiasing, terrain)
 * - Localization and accessibility
 *
 * @see [MapLibre MapOptions](https://maplibre.org/maplibre-gl-js-docs/api/map/)
 *
 * @group Map
 */
export type MapLibreOptions = Omit<MapOptions, 'style' | 'attributionControl'>;
