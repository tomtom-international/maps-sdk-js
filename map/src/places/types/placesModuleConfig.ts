import type { Place } from '@cet/maps-sdk-js/core';
import type { DataDrivenPropertyValueSpecification } from 'maplibre-gl';
import type { MapStylePOICategory } from '../../pois/poiCategoryMapping';
import type { MapFont } from '../../shared';

/**
 * Icon style options for displaying places on the map.
 *
 * @remarks
 * **Available Styles:**
 * - `pin`: Traditional map pin markers (teardrop shape)
 * - `circle`: Simple circular markers
 * - `poi-like`: Mimics the map's built-in POI layer style with category icons
 *
 * @example
 * ```typescript
 * // Use pin markers
 * const iconStyle: IconStyle = 'pin';
 *
 * // Use circles for minimal design
 * const iconStyle: IconStyle = 'circle';
 *
 * // Match map POI style
 * const iconStyle: IconStyle = 'poi-like';
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type IconStyle = 'pin' | 'circle' | 'poi-like';

/**
 * Custom icon configuration for a specific place category.
 *
 * Allows you to provide custom marker images for different POI categories,
 * replacing the default icons with your own branding or design.
 *
 * @remarks
 * Icon images can be URLs or data URIs. They will be loaded and added to the
 * map style sprite for rendering.
 *
 * @example
 * ```typescript
 * const customIcon: CustomIcon = {
 *   category: 'RESTAURANT',
 *   iconUrl: '/icons/restaurant-marker.png',
 *   pixelRatio: 2  // For high-DPI screens
 * };
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type CustomIcon = {
    /**
     * POI category this icon applies to.
     *
     * Must match a valid MapStylePOICategory value (e.g., 'RESTAURANT', 'HOTEL_MOTEL').
     */
    category: MapStylePOICategory;

    /**
     * URL or data URI of the icon image.
     *
     * @example
     * ```typescript
     * // URL
     * iconUrl: 'https://example.com/marker.png'
     *
     * // Data URI
     * iconUrl: 'data:image/png;base64,iVBORw0KG...'
     *
     * // Relative path
     * iconUrl: '/assets/icons/marker.png'
     * ```
     */
    iconUrl: string;

    /**
     * The pixel ratio of the icon image.
     *
     * Use `2` for high-DPI (Retina) displays, `1` for standard displays.
     * Higher values result in sharper icons on high-resolution screens.
     *
     * @default 2
     *
     * @example
     * ```typescript
     * pixelRatio: 2  // For @2x resolution images
     * ```
     */
    pixelRatio?: number;
};

/**
 * Configuration for place marker icons.
 *
 * Controls the visual appearance of place markers including style and custom icons.
 *
 * @example
 * ```typescript
 * // Use pin style
 * const iconConfig: PlaceIconConfig = {
 *   iconStyle: 'pin'
 * };
 *
 * // Custom icons for specific categories
 * const iconConfig: PlaceIconConfig = {
 *   iconStyle: 'poi-like',
 *   customIcons: [
 *     { category: 'RESTAURANT', iconUrl: '/icons/food.png', pixelRatio: 2 },
 *     { category: 'HOTEL_MOTEL', iconUrl: '/icons/hotel.png', pixelRatio: 2 }
 *   ]
 * };
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type PlaceIconConfig = {
    /**
     * Base icon style for all places.
     *
     * @default 'pin'
     */
    iconStyle?: IconStyle;

    /**
     * Array of custom icons for specific place categories.
     *
     * When provided, places matching these categories will use the custom icons
     * instead of the default style.
     */
    customIcons?: CustomIcon[];
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
 *   textField: (place) => place.properties.poi?.name || place.properties.address.freeformAddress
 * };
 *
 * // Using MapLibre expression with styling
 * const textConfig: PlaceTextConfig = {
 *   textField: ['get', 'title'],
 *   textSize: 14,
 *   textColor: '#333',
 *   textHaloColor: '#fff',
 *   textHaloWidth: 2
 * };
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type PlaceTextConfig = {
    /**
     * Text content for the label.
     *
     * Can be a function that extracts text from the place properties,
     * or a MapLibre expression for data-driven content.
     *
     * @example
     * ```typescript
     * // Function
     * textField: (place) => place.properties.poi?.name || 'Unknown'
     *
     * // MapLibre expression
     * textField: ['get', 'title']
     *
     * // Conditional expression
     * textField: ['case', ['has', 'name'], ['get', 'name'], ['get', 'address']]
     * ```
     */
    textField?: ((place: Place) => string) | DataDrivenPropertyValueSpecification<string>;

    /**
     * Font size in pixels.
     *
     * @default 12
     *
     * @example
     * ```typescript
     * textSize: 14
     *
     * // Data-driven size based on importance
     * textSize: ['interpolate', ['linear'], ['get', 'priority'], 1, 16, 10, 10]
     * ```
     */
    textSize?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Text color.
     *
     * @default '#000000'
     *
     * @example
     * ```typescript
     * textColor: '#333333'
     *
     * // Category-based colors
     * textColor: ['match', ['get', 'category'], 'RESTAURANT', '#D32F2F', '#1976D2']
     * ```
     */
    textColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Font face(s) to use for the text.
     *
     * @example
     * ```typescript
     * textFont: ['Open Sans Bold', 'Arial Unicode MS Bold']
     * ```
     */
    textFont?: DataDrivenPropertyValueSpecification<Array<MapFont>>;

    /**
     * Text halo (outline) color for better readability.
     *
     * @default '#FFFFFF'
     *
     * @example
     * ```typescript
     * textHaloColor: '#fff'
     * ```
     */
    textHaloColor?: DataDrivenPropertyValueSpecification<string>;

    /**
     * Text halo (outline) width in pixels.
     *
     * @default 1
     *
     * @example
     * ```typescript
     * textHaloWidth: 2  // Thicker outline for better contrast
     * ```
     */
    textHaloWidth?: DataDrivenPropertyValueSpecification<number>;

    /**
     * Text offset from the icon in ems [x, y].
     *
     * Positive x moves right, positive y moves down.
     *
     * @default [0, 0]
     *
     * @example
     * ```typescript
     * textOffset: [0, 1.5]  // Position text below icon
     *
     * textOffset: [1, 0]  // Position text to the right
     * ```
     */
    textOffset?: DataDrivenPropertyValueSpecification<[number, number]>;
};

/**
 * Configuration options for the PlacesModule.
 *
 * Controls the appearance and behavior of place markers and labels displayed on the map.
 *
 * @example
 * ```typescript
 * // Basic configuration
 * const config: PlacesModuleConfig = {
 *   iconConfig: {
 *     iconStyle: 'pin'
 *   },
 *   textConfig: {
 *     textField: (place) => place.properties.poi?.name || 'Unknown',
 *     textSize: 12
 *   }
 * };
 *
 * // Advanced configuration with custom properties
 * const config: PlacesModuleConfig = {
 *   iconConfig: {
 *     iconStyle: 'poi-like',
 *     customIcons: [
 *       { category: 'RESTAURANT', iconUrl: '/icons/restaurant.png' }
 *     ]
 *   },
 *   textConfig: {
 *     textField: ['get', 'title'],
 *     textSize: 14,
 *     textColor: '#333',
 *     textHaloColor: '#fff',
 *     textHaloWidth: 2
 *   },
 *   extraFeatureProps: {
 *     category: (place) => place.properties.poi?.categories?.[0],
 *     hasParking: (place) => place.properties.poi?.name?.includes('parking')
 *   }
 * };
 * ```
 *
 * @group Map Modules
 * @category Types
 */
export type PlacesModuleConfig = {
    /**
     * Icon appearance configuration.
     *
     * Controls marker style and custom icons for different place categories.
     */
    iconConfig?: PlaceIconConfig;

    /**
     * Text label configuration.
     *
     * Controls label content, styling, and positioning.
     */
    textConfig?: PlaceTextConfig;

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
