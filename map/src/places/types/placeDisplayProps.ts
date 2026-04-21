import type { Anything, CommonPlaceProps } from '@tomtom-org/maps-sdk/core';
import type { SupportsEvents } from '../../shared';

/**
 * Properties attached to a place feature for rendering on the map.
 *
 * @remarks
 * Extends the source place with display-only fields consumed by the places
 * layer stack. Which fields are populated depends on the active
 * {@link PlacesTheme | theme}:
 *
 * - Every theme uses {@link PlaceDisplayProps.iconID | iconID} — the sprite name
 *   the main layer's `icon-image` expression binds to via `['get', 'iconID']`.
 *   The base map's POI-Micro-like layer inherits the style's `['get','group']`
 *   expression verbatim, so custom `PlaceIconConfig.categoryIcons` sprites only
 *   apply to the `main` layer.
 * - The `base-map` theme additionally populates
 *   {@link PlaceDisplayProps.category | category} and
 *   {@link PlaceDisplayProps.group | group} so the base map style's own
 *   `text-color` expression — and the POI-Micro layer's `icon-image` expression
 *   — resolve against the place feature just as they do for native POIs.
 *
 * @example
 * ```typescript
 * const pinPlaceProps: PlaceDisplayProps = {
 *   id: 'place-123',
 *   title: 'Central Station',
 *   iconID: 'poi-transit',
 * };
 *
 * const baseMapPlaceProps: PlaceDisplayProps = {
 *   id: 'place-123',
 *   title: 'Central Station',
 *   iconID: 'poi-railway_station',
 *   category: 'railway_station',
 *   group: 'transport',
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
     * MapLibre does not reuse the feature IDs, so we either generate one on the
     * fly or promote the one from `properties.id` via the source's `promoteId`
     * option. Used for feature identification in events, hit-testing, and data
     * updates.
     *
     * @example
     * ```typescript
     * id: 'place-123'
     * ```
     */
    id: string;

    /**
     * Text label rendered next to the place marker.
     *
     * @remarks
     * Optional — when absent no label is drawn. Typically sourced from the POI
     * name or free-form address, but can be any custom string (e.g., configured
     * via `PlacesModuleConfig.text.title`).
     *
     * @example
     * ```typescript
     * title: 'Amsterdam Central Station'
     * ```
     */
    title?: string;

    /**
     * Sprite image ID used to draw the place marker.
     *
     * @remarks
     * The main layer binds `icon-image` to `['get', 'iconID']`, so the sprite
     * named here is what renders. The base map's POI-Micro-like layer inherits
     * the style's group-driven expression verbatim and ignores this value. The
     * sprite name is resolved per theme: `pin` / `circle-icon` pick a built-in
     * sprite; `base-map` picks the base map's `poi-<category>` sprite; a custom
     * `PlaceIconConfig.categoryIcons` entry overrides the default for the main
     * layer on any theme.
     *
     * @example
     * ```typescript
     * iconID: '7315'              // pin theme sprite
     * iconID: 'poi-restaurant'    // circle-icon / base-map theme sprite
     * iconID: 'custom-marker-0'   // user-provided custom icon
     * ```
     */
    iconID: string;

    /**
     * Base map style POI category the place should be rendered as.
     *
     * @remarks
     * Populated only for the `base-map` theme. Values are the lowercased
     * identifiers used by the base map style (derived via
     * {@link toBaseMapPOICategory}). Drives the inherited `text-color`
     * expression on the main/selected POI-like layers.
     *
     * @example
     * ```typescript
     * category: 'restaurant'
     * category: 'hotel_or_motel'
     * category: 'charging_location'
     * ```
     */
    category?: string;

    /**
     * Base map style POI group the place belongs to.
     *
     * @remarks
     * Populated only for the `base-map` theme. Drives the inherited
     * `text-color` expression on the base map's POI layers.
     * Valid values are those produced by {@link toBaseMapPOIGroup} — e.g.,
     * `eat_and_drink`, `lodging`, `driving`, `transport`, `shopping`,
     * `healthcare`, `finance`, `cultural`, `leisure`, `sport`, `outdoor`,
     * `protected`, `public`, `religion`, `military`, `business`, `education`,
     * `parking`.
     */
    group?: string;
} & SupportsEvents &
    Anything;

/**
 * Full property shape used by the PlacesModule when rendering a place: the
 * core place data ({@link CommonPlaceProps}) merged with the display-only
 * fields the module attaches ({@link PlaceDisplayProps}).
 *
 * @example
 * ```typescript
 * const place: DisplayPlaceProps = {
 *   type: 'POI',
 *   poi: {
 *     name: 'Central Station',
 *     categories: ['RAILWAY_STATION'],
 *   },
 *   address: {
 *     streetName: 'Damrak',
 *     municipalitySubdivision: 'Amsterdam',
 *     countryCode: 'NL',
 *   },
 *   id: 'place-123',
 *   title: 'Amsterdam Central Station',
 *   iconID: 'poi-railway_station',
 *   category: 'railway_station',
 *   group: 'transport',
 * };
 * ```
 *
 * @group Places
 */
export type DisplayPlaceProps = CommonPlaceProps & PlaceDisplayProps;
