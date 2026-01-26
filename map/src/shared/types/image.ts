/**
 * Availability level for POI icons with availability indicators.
 * 
 */
export type AvailabilityLevel = 'available' | 'occupied';

/**
 * Basic structure to define custom map icons, which end up in the map sprite.
 *
 * Allows you to provide custom images for various map icons such as
 * POIs, route waypoints, charging stations, and any other TomTom map icons,
 * replacing the default icons with your own branding or design.
 *
 * @remarks
 * Icon images can be URLs, raw SVG texts, data URIs or loaded img elements.
 * They will be loaded/transformed if necessary and added to the map style sprite for rendering.
 *
 * @example
 * ```typescript
 * // POI category icon
 * const poiIcon: CustomIcon = {
 *   id: 'RESTAURANT',
 *   image: '/icons/restaurant-marker.png',
 * };
 *
 * // Route waypoint icon
 * const waypointIcon: CustomIcon = {
 *   id: WAYPOINT_START_IMAGE_ID,
 *   image: '/icons/waypoint-start.png',
 * };
 *
 * // Charging station icon
 * const chargingIcon: CustomIcon = {
 *   id: 'my-charging-station',
 *   image: '/icons/ev-charger-low-res.png',
 *   pixelRatio: 1
 * };
 * ```
 *
 * @see https://maplibre.org/maplibre-style-spec/sprite/
 * @group Shared
 */
export type CustomImage<I extends string = string> = {
    /**
     * Unique identifier for the icon in the map sprite.
     *
     * This ID is used to reference the icon when styling map features.
     * The specific values depend on the context:
     * - For POI categories: Use MapStylePOICategory values (e.g., 'RESTAURANT', 'HOTEL_MOTEL')
     * - For route waypoints: Use waypoint identifiers (e.g., 'waypoint-start', 'waypoint-end')
     * - For charging stations: Use station type identifiers (e.g., 'ELECTRIC_VEHICLE_STATION')
     * - For custom markers: Use any unique string identifier
     */
    id: I;

    /**
     * URL or data URI of the icon image.
     *
     * @remarks
     * This property is optional. If omitted, the icon with the corresponding `id`
     * must already exist in the map's sprite. Use this property when you need to add
     * a new icon to the sprite, or provide `undefined` when referencing an existing sprite icon.
     *
     * @example
     * ```typescript
     * // Adding a new icon to the sprite
     * image: 'https://example.com/marker.png'
     *
     * // Using a data URI
     * image: 'data:image/png;base64,iVBORw0KG...'
     *
     * // Using a relative path
     * image: '/assets/icons/marker.png'
     *
     * // Referencing an existing sprite icon (no URL needed)
     * // image is omitted when the icon already exists in the sprite
     * ```
     */
    image?: string | HTMLImageElement;

    /**
     * The pixel ratio of the icon image.
     *
     * @remarks
     * This property is optional and only relevant when `image` is provided.
     * If omitted while providing an `image`, it defaults to `2`.
     * When the icon already exists in the sprite (no `image`), this property is ignored.
     *
     * Use `2` for high-DPI (Retina) displays, `1` for standard displays.
     * Higher values result in sharper icons on high-resolution screens.
     *
     * @default 2 (recommended for modern screens)
     *
     * @example
     * ```typescript
     * // For @2x resolution images
     * pixelRatio: 2
     *
     * // For standard resolution images
     * pixelRatio: 1
     * ```
     */
    pixelRatio?: number;

    /**
     * Availability level for POI icons with availability indicators.
     *
     * @remarks
     * Used when displaying custom icons for POIs with real-time availability data.
     * The SDK will select the appropriate icon based on the availability ratio and
     * configured threshold.
     *
     * - `'available'`: Used when ratio >= threshold (sufficient capacity available)
     * - `'occupied'`: Used when ratio < threshold (low or no availability)
     *
     *
     * @example
     * ```typescript
     * // Define custom icons for both availability states
     * categoryIcons: [
     *   {
     *     id: 'ELECTRIC_VEHICLE_STATION',
     *     image: greenChargingSVG,
     *     availabilityLevel: 'available'
     *   },
     *   {
     *     id: 'ELECTRIC_VEHICLE_STATION',
     *     image: redChargingSVG,
     *     availabilityLevel: 'occupied'
     *   }
     * ]
     * ```
     */
    availabilityLevel?: AvailabilityLevel;
};

/**
 * Options to style SDK SVG icons with custom colors and opacity.
 *
 * @example
 * ```typescript
 * const style: SVGIconStyleOptions = {
 *   fillColor: '#00FF00',
 *   outlineColor: '#000000',
 *   outlineOpacity: 0.5
 * };
 * ```
 * @group Shared
 */
export type SVGIconStyleOptions = {
    /**
     * The fill color to apply to the SVG icon (e.g., '#FF0000' or 'red').
     */
    fillColor?: string;
    /**
     * The outline (stroke) color to apply to the SVG icon.
     */
    outlineColor?: string;
    /**
     * The opacity of the outline, from 0 (transparent) to 1 (opaque).
     */
    outlineOpacity?: number;
};
