import type { Anything, CommonPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { SupportsEvents } from '../../shared';

/**
 * Properties to display a place on the map.
 *
 * Extends basic place information with display-specific properties needed
 * for rendering markers, icons, and labels on the map.
 *
 * @remarks
 * **Use Cases:**
 * - Search result markers
 * - POI markers
 * - Custom location pins
 * - EV charging station markers
 *
 * These properties control how the place appears visually on the map,
 * including its icon, label, and interactive states.
 *
 * @example
 * ```typescript
 * const locationProps: LocationDisplayProps = {
 *   id: 'place-123',
 *   title: 'Central Station',
 *   iconID: 'poi-transit',
 *   category: 'RAILWAY_STATION',
 *   eventState: 'hover'
 * };
 * ```
 *
 * @group Places
 */
export type PlaceDisplayProps = {
    /**
     * Unique identifier for the place feature.
     *
     * @remarks
     * MapLibre does not reuse the feature IDs. Either we generate it on the fly
     * or use the one from properties via promotedId value.
     *
     * Used for:
     * - Feature identification in events
     * - State management
     * - Data updates
     *
     * @example
     * ```typescript
     * id: 'place-123'
     * id: 'poi-456'
     * ```
     */
    id: string;

    /**
     * Display title for the place on the map.
     *
     * @remarks
     * Optional text label shown near the place marker. If not provided,
     * no text label will be displayed.
     *
     * **Common Sources:**
     * - POI name (e.g., "Starbucks")
     * - Address (e.g., "123 Main Street")
     * - Custom label (e.g., "Meeting Point")
     *
     * @example
     * ```typescript
     * title: 'Amsterdam Central Station'
     * title: 'Starbucks'
     * title: '123 Main Street'
     * title: undefined  // No label
     * ```
     */
    title?: string;

    /**
     * Icon ID referencing the map style sprite.
     *
     * @remarks
     * References an icon image in the map's sprite sheet. The icon must exist
     * in the map style or be added programmatically.
     *
     * **Icon Types:**
     * - Built-in POI icons (e.g., 'poi-restaurant', 'poi-hotel')
     * - Custom icons added to the sprite
     * - Pin/marker icons (e.g., 'pin-red', 'pin-blue')
     *
     * @example
     * ```typescript
     * iconID: 'poi-restaurant'
     * iconID: 'pin-red'
     * iconID: 'custom-marker'
     * ```
     */
    iconID: string;

    /**
     * Map-style-compatible display category, mostly applicable for base-map places.
     *
     * @remarks
     * Used to match the place with a POI category in the map style, enabling
     * category-specific styling and filtering.
     *
     * **Common Categories:**
     * - RESTAURANT
     * - HOTEL_MOTEL
     * - GAS_STATION
     * - PARKING_GARAGE
     * - SHOPPING
     *
     * Optional - only needed when using base-map styling or category-based filtering.
     *
     * @example
     * ```typescript
     * category: 'RESTAURANT'
     * category: 'HOTEL_MOTEL'
     * category: 'EV_CHARGING_STATION'
     * category: undefined  // No category association
     * ```
     */
    category?: string;
} & SupportsEvents &
    Anything;

/**
 * Place base and display properties combined.
 *
 * Merges complete place information from the core API with display-specific
 * properties for rendering on the map.
 *
 * @remarks
 * This is the full type used by the PlacesModule for rendering search results,
 * POIs, and other location markers on the map. It combines:
 * - Geographic data (coordinates, address)
 * - Place metadata (POI info, opening hours, etc.)
 * - Display properties (icon, title, category)
 * - Interactive state (event handling)
 *
 * @example
 * ```typescript
 * const place: DisplayPlaceProps = {
 *   type: 'Point',
 *   position: { lon: 4.9, lat: 52.3 },
 *   address: {
 *     streetName: 'Damrak',
 *     municipalitySubdivision: 'Amsterdam',
 *     countryCode: 'NL'
 *   },
 *   poi: {
 *     name: 'Central Station',
 *     categories: ['RAILWAY_STATION']
 *   },
 *   id: 'place-123',
 *   title: 'Amsterdam Central Station',
 *   iconID: 'poi-transit',
 *   category: 'RAILWAY_STATION'
 * };
 * ```
 *
 * @group Places
 */
export type DisplayPlaceProps = CommonPlaceProps & PlaceDisplayProps;
