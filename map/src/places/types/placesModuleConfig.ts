import type { Place } from '@tomtom-org/maps-sdk/core';
import type { DataDrivenPropertyValueSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { MapStylePOICategory } from '../../pois/poiCategoryMapping';
import type { CustomImage, HasAdditionalLayersConfig, MapFont, ToBeAddedLayerSpecTemplate } from '../../shared';

/**
 * Icon style options for displaying places on the map.
 *
 * @remarks
 * **Available Styles:**
 * - `pin`: Traditional map pin markers (teardrop shape)
 * - `circle`: Simple circular markers
 * - `base-map`: Mimics the map's built-in POI layer style with category icons
 *
 * @group Places
 */
export type PlacesTheme = 'pin' | 'circle' | 'base-map';

/**
 * Configuration for place marker icons.
 *
 * Controls the visual appearance of place markers including custom icons.
 *
 * @example
 * ```typescript
 * // Custom icons for specific categories
 * const iconConfig: PlaceIconConfig = {
 *   customIcons: [
 *     { category: 'RESTAURANT', image: '/icons/food.png', pixelRatio: 2 },
 *     { category: 'HOTEL_MOTEL', image: '/icons/hotel.png', pixelRatio: 2 }
 *   ]
 * };
 * ```
 *
 * @group Places
 */
export type PlaceIconConfig = {
    /**
     * Array of custom icons for specific place categories.
     *
     * When provided, places matching these categories will use the custom icons
     * instead of the default style.
     */
    customIcons?: CustomImage<MapStylePOICategory>[];
};

/**
 * Configuration for place text labels.
 *
 * Controls how text labels are displayed next to place markers, including
 * content, styling, and positioning.
 *
 * @remarks
 * All text properties support both functions (for dynamic values) and MapLibre
 * expressions (for data-driven styling).
 *
 * @example
 * ```typescript
 * // Simple text from place name
 * const textConfig: PlaceTextConfig = {
 *   field: (place) => place.properties.poi?.name || place.properties.address.freeformAddress
 * };
 *
 * // Using MapLibre expression with styling
 * const textConfig: PlaceTextConfig = {
 *   field: ['get', 'title'],
 *   size: 14,
 *   color: '#333',
 *   haloColor: '#fff',
 *   haloWidth: 2
 * };
 * ```
 *
 * @group Places
 */
export type PlaceTextConfig = {
    /**
     * Text content for the label.
     *
     * Can be a function that extracts text from the place properties (data-based),
     * or a MapLibre expression for data-driven content (data-driven layer-based).
     *
     * @example
     * ```typescript
     * // Function
     * title: (place) => place.properties.poi?.name || 'Unknown'
     *
     * // MapLibre expression
     * title: ['get', 'title']
     *
     * // Conditional expression
     * title: ['case', ['has', 'name'], ['get', 'name'], ['get', 'address']]
     * ```
     *
     * @see https://maplibre.org/maplibre-style-spec/types/#formatted
     */
    title?: ((place: Place) => string) | DataDrivenPropertyValueSpecification<string>;

    /**
     * Font size in pixels.
     *
     * @default 12
     *
     * @example
     * ```typescript
     * size: 14
     *
     * // Data-driven size based on importance
     * size: ['interpolate', ['linear'], ['get', 'priority'], 1, 16, 10, 10]
     * ```
     */
    size?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Text color.
     *
     * @default '#000000'
     *
     * @example
     * ```typescript
     * color: '#333333'
     *
     * // Category-based colors
     * color: ['match', ['get', 'category'], 'RESTAURANT', '#D32F2F', '#1976D2']
     * ```
     */
    color?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Font face(s) to use for the text.
     *
     * @example
     * ```typescript
     * font: ['Open Sans Bold', 'Arial Unicode MS Bold']
     * ```
     */
    font?: DataDrivenPropertyValueSpecification<Array<MapFont>>;

    /**
     * Text halo (outline) color for better readability.
     *
     * @default '#FFFFFF'
     *
     * @example
     * ```typescript
     * haloColor: '#fff'
     * ```
     */
    haloColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Text halo (outline) width in pixels.
     *
     * @default 1
     *
     * @example
     * ```typescript
     * haloWidth: 2  // Thicker outline for better contrast
     * ```
     */
    haloWidth?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Text offset from the icon in ems [x, y].
     *
     * Positive x moves right, positive y moves down.
     *
     * @default [0, 0]
     *
     * @example
     * ```typescript
     * offset: [0, 1.5]  // Position text below icon
     *
     * offset: [1, 0]  // Position text to the right
     * ```
     */
    offset?: DataDrivenPropertyValueSpecification<[number, number]>;
};

/**
 * Configuration for custom place layer styling with MapLibre specifications.
 *
 * @remarks
 * Provides fine-grained control over place marker layers, allowing customization
 * of both the main place markers and highlighted/selected place markers.
 *
 * The layer IDs are derived from the PlacesModule instance prefix plus the key suffix:
 * - `main`: The primary layer for displaying all places
 * - `selected`: The layer for displaying highlighted/clicked places (rendered on top)
 *
 * All fields are optional. When a field is not provided, the default styling will be used.
 *
 * @example
 * ```typescript
 * const config: PlacesModuleConfig = {
 *   layers: {
 *     main: {
 *       layout: {
 *         'icon-size': 1.2,
 *         'text-size': 14
 *       },
 *       paint: {
 *         'text-color': '#333'
 *       }
 *     },
 *     selected: {
 *       layout: {
 *         'icon-size': 1.5,
 *         'text-allow-overlap': true
 *       },
 *       paint: {
 *         'text-color': '#3f9cd9'
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @group Places
 */
export type PlaceLayersConfig = {
    /**
     * Main place marker layer specification.
     *
     * @remarks
     * Controls the visual appearance of all place markers on the map.
     * This layer renders places that are not in a highlighted/selected state.
     */
    main?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;

    /**
     * Selected/highlighted place marker layer specification.
     *
     * @remarks
     * Controls the visual appearance of places when they are highlighted or selected
     * (e.g., on hover or click events). This layer is rendered on top of the main layer
     * to ensure selected places are always visible.
     */
    selected?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
} & HasAdditionalLayersConfig;

/**
 * @group Places
 */
export type PlaceLayerName = keyof PlaceLayersConfig;

/**
 * Configuration options for the PlacesModule.
 *
 * Controls the appearance and behavior of place markers and labels displayed on the map.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * const config: PlacesModuleConfig = {
 *   icon: {
 *     style: 'pin'
 *   },
 *   text: {
 *     field: (place) => place.properties.poi?.name || 'Unknown',
 *     size: 12
 *   }
 * };
 *
 * // Advanced configuration with custom properties
 * const config: PlacesModuleConfig = {
 *   icon: {
 *     style: 'base-map',
 *     customIcons: [
 *       { category: 'RESTAURANT', image: '/icons/restaurant.png' }
 *     ]
 *   },
 *   text: {
 *     field: ['get', 'title'],
 *     size: 14,
 *     color: '#333',
 *     haloColor: '#fff',
 *     haloWidth: 2
 *   },
 *   extraFeatureProps: {
 *     category: (place) => place.properties.poi?.categories?.[0],
 *     hasParking: (place) => place.properties.poi?.name?.includes('parking')
 *   }
 * };
 * ```
 *
 * @group Places
 */
export type PlacesModuleConfig = {
    /**
     * Base style for all places.
     *
     * @remarks
     * Can be overwritten by more advanced icon configurations.
     *
     * @default 'pin'
     */
    theme?: PlacesTheme;

    /**
     * Icon appearance configuration.
     *
     * Controls marker style and custom icons for different place categories.
     */
    icon?: PlaceIconConfig;

    /**
     * Text label configuration.
     *
     * Controls label content, styling, and positioning.
     */
    text?: PlaceTextConfig;

    /**
     * Custom layer styling configuration.
     *
     * @remarks
     * * Overrides the default layer styling with custom specifications.
     * * You must provide complete layer specifications for any layers you wish to customize.
     * * You can still reuse the default configurations if you want incremental changes. See: buildPlacesLayerSpecs.
     * * Any layer not specified will continue to use its default styling.
     * * Use this only if you need fine MapLibre control on how places are displayed.
     */
    layers?: PlaceLayersConfig;

    /**
     * Additional properties to compute for each place feature.
     *
     * These properties are added to the feature and can be used in styling expressions
     * or event handlers. Values can be static or computed from place data.
     *
     * @remarks
     * Useful for:
     * - Adding computed flags for conditional styling
     * - Extracting nested properties for easier access
     * - Adding business logic properties
     *
     * @example
     * ```typescript
     * extraFeatureProps: {
     *   // Static property
     *   source: 'search-results',
     *
     *   // Computed property
     *   category: (place) => place.properties.poi?.categories?.[0],
     *   rating: (place) => place.properties.poi?.rating || 0,
     *   hasOpeningHours: (place) => !!place.properties.poi?.openingHours,
     *
     *   // Complex computation
     *   distanceFromCenter: (place) => {
     *     const coords = place.geometry.coordinates;
     *     return Math.sqrt(Math.pow(coords[0] - 4.9, 2) + Math.pow(coords[1] - 52.3, 2));
     *   }
     * }
     * ```
     */
    extraFeatureProps?: { [key: string]: ((place: Place) => any) | any };
};
