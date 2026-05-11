import type { Place } from '@tomtom-org/maps-sdk/core';
import type {
    CircleLayerSpecification,
    DataDrivenPropertyValueSpecification,
    LineLayerSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type { MapStylePOICategory } from '../../pois/util/poiCategoryMapping';
import type {
    CustomImage,
    HasAdditionalLayersConfig,
    MapFont,
    MapModuleCommonConfig,
    SVGIconStyleOptions,
    ToBeAddedLayerSpecTemplate,
} from '../../shared';

/**
 * Icon style options for displaying places on the map.
 *
 * @remarks
 * **Available Styles:**
 * - `pin`: Traditional map pin markers (teardrop shape)
 * - `circle-icon`: Simple circular markers (previously named `circle`)
 * - `base-map`: Mimics the map's built-in POI layer style with category icons (combines `main`, `selected`, and `micro` layers). For micro-only rendering, hide the `main` layer via `layers.main.layout.visibility = 'none'`.
 * - `pin-clustered`: Same teardrop pins as `pin` for un-clustered places, with nearby
 *   places aggregated into a single icon. Single-category clusters render the matching
 *   base-map POI sprite with a small black count badge in the top-right; mixed-category
 *   clusters render a larger centred count circle in place of the icon. Cluster features
 *   expose `clusterBaseMapIconIDs` (comma-separated, deduplicated) on their properties.
 *
 * @group Places
 */
export type PlacesTheme = 'pin' | 'circle-icon' | 'base-map' | 'pin-clustered';

/**
 * Configuration for EV charging station availability display.
 *
 * @remarks
 * **Opt-In Feature:**
 * - Disabled by default - set `enabled: true` to activate
 * - Requires fetching availability via {@link getPlacesWithEVAvailability}
 * - Each PlacesModule can enable/disable independently
 *
 * When enabled, displays formatted availability text (e.g., "3/10") below the station name
 * with color-coding based on availability ratio: green (high), orange (limited), red (none/low).
 *
 * @example
 * ```typescript
 * // Enable with defaults
 * const places = await PlacesModule.get(map, {
 *   evAvailability: { enabled: true }
 * });
 * const stations = await search({ poiCategories: ['ELECTRIC_VEHICLE_STATION'] });
 * places.show(await getPlacesWithEVAvailability(stations));
 *
 * // Custom threshold and format
 * const places = await PlacesModule.get(map, {
 *   evAvailability: {
 *     enabled: true,
 *     threshold: 0.5,
 *     formatText: (available, total) => `${available} of ${total}`
 *   }
 * });
 *
 * // Combine with custom icon
 * const places = await PlacesModule.get(map, {
 *   icon: {
 *     categoryIcons: [{
 *       id: 'ELECTRIC_VEHICLE_STATION',
 *       image: customEvIconSvg,
 *       pixelRatio: 2
 *     }]
 *   },
 *   evAvailability: { enabled: true }
 * });
 * ```
 *
 * @group Places
 */
export type EVAvailabilityConfig = {
    /**
     * Enable or disable EV availability display.
     *
     * @remarks
     * Must be explicitly set to `true` to display availability.
     */
    enabled?: boolean;

    /**
     * Availability ratio threshold for determining available vs occupied.
     *
     * @remarks
     * - `ratio >= threshold`: Available (green)
     * - `ratio < threshold`: Occupied (red)
     *
     * @default 0
     */
    threshold?: number;

    /**
     * Custom function to format the availability text.
     *
     * @param available - Number of available charging points
     * @param total - Total number of charging points
     * @returns Formatted availability text
     *
     * @default (available, total) => `${available}/${total}`
     */
    formatText?: (available: number, total: number) => string;
};

/**
 * Configuration for the default place icon.
 * * This is the icon that is used for clicked locations and addresses without a specific category.
 *
 * @group Places
 */
export type DefaultPlaceIconConfig = {
    /**
     * Base style options for the SVG default icon.
     *
     * @remarks
     * Use this to set the fill color, outline color, and outline opacity for the default waypoint icon.
     *
     * Example:
     * ```typescript
     * baseStyle: {
     *   fillColor: '#007AFF',
     *   outlineColor: '#FFFFFF',
     *   outlineOpacity: 0.8
     * }
     * ```
     */
    style?: SVGIconStyleOptions;

    /**
     * Custom image for the default icon.
     *
     * @remarks
     * If provided, this image will be used instead of the default icon.
     *
     * If an SVG image is provided, the 'style' options can still apply. Otherwise, 'style' is ignored.
     */
    image?: Omit<CustomImage, 'id'>;
};

/**
 * Configuration for place marker icons.
 *
 * Controls the visual appearance of place markers including custom icons.
 *
 * @example
 * ```typescript
 * // Custom icons for specific categories
 * const iconConfig: PlaceIconConfig = {
 *   categoryIcons: [
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
     * Configuration for the default place icon.
     * * The default icon is the one used for clicked locations and addresses without a specific category, or via custom mapping.
     */
    default?: DefaultPlaceIconConfig;

    /**
     * Array of custom icons for specific place categories.
     *
     * When provided, places matching these categories will use the custom icons
     * instead of the default style.
     */
    categoryIcons?: CustomImage<MapStylePOICategory>[];

    /**
     * Custom mapping to determine the icon for a given place.
     *
     * @remarks
     * Supports two mapping strategies:
     *
     * - **`imageID`**: Directly returns the icon image ID to use for the place.
     *   This provides full control over icon selection.
     *
     * - **`poiCategory`**: Returns a POI category, which is then resolved to an icon
     *   using the existing category-to-icon logic. This reuses the standard category mapping.
     *
     * @example
     * ```typescript
     * // Direct image ID mapping
     * mapping: {
     *   to: 'imageID',
     *   fn: (place) => place.properties.poi?.name?.includes('urgent') ? 'urgent-icon' : 'default-icon'
     * }
     *
     * // POI category mapping
     * mapping: {
     *   to: 'poiCategory',
     *   fn: (place) => place.properties.customCategory || 'RESTAURANT'
     * }
     * ```
     */
    mapping?:
        | { to: 'imageID'; fn: (place: Place) => string }
        | { to: 'poiCategory'; fn: (place: Place) => MapStylePOICategory };
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

    // TODO: these configs seem to overlap quite a bit with just overriding via maplibre, maybe not worth it?

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
     * Text offset from the icon in ems.
     *
     * Applies uniformly to all anchor positions (top, left, right).
     * Positive values increase distance from icon.
     *
     * @default undefined (uses automatic offset calculation based on icon size)
     *
     * @example
     * ```typescript
     * offset: 1.5  // Position text 1.5em away from icon in whichever direction the renderer chooses
     * ```
     */
    offset?: number;
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
     * Micro place marker layer specification.
     *
     * @remarks
     * Always registered and stacked below the `main` layer, but only renders features
     * when the `base-map` theme is active — in that mode it mirrors the map style's
     * `POI - Micro` layer so place markers blend with the base map's lower-density
     * POI rendering. For other themes the layer is hidden via
     * `layout.visibility = 'none'` and acts as a no-op, making theme switches cheap
     * (no add/remove layer churn).
     */
    micro?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;

    /**
     * Selected place marker layer specification.
     *
     * @remarks
     * Controls the visual appearance of places when they are highlighted or selected
     * (e.g., on hover or click events). This layer is rendered on top of the main layer
     * to ensure selected places are always visible.
     *
     * This layer reacts to 'hover' and 'click' event states.
     */
    selected?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;

    /**
     * Cluster pin layer specification.
     *
     * @remarks
     * Always registered and stacked above `selected`, but only renders under the
     * `pin-clustered` theme and only for single-category clusters — every leaf in
     * the cluster shares the same base-map sprite, picked via a `match` over the
     * aggregated `clusterBaseMapIconIDs` property. Mixed-category clusters fall
     * through to {@link clusterMixedBadge} + {@link clusterMixedCount} instead.
     * For other themes the layer is hidden via `layout.visibility = 'none'`.
     */
    cluster?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;

    /**
     * Cluster count badge background layer specification.
     *
     * @remarks
     * Black circle drawn at the top-right of each single-category cluster pin.
     * Acts as the background for {@link clusterCount}. Only visible under the
     * `pin-clustered` theme and gated to single-category clusters; mixed
     * clusters use {@link clusterMixedBadge} instead.
     */
    clusterBadge?: Partial<ToBeAddedLayerSpecTemplate<CircleLayerSpecification>>;

    /**
     * Cluster count text layer specification.
     *
     * @remarks
     * White count rendered on top of {@link clusterBadge} for single-category
     * clusters. Reads the `point_count_abbreviated` property MapLibre sets on
     * every cluster feature. Only visible under the `pin-clustered` theme;
     * mixed clusters use {@link clusterMixedCount} instead.
     */
    clusterCount?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;

    /**
     * Centred count badge for mixed-category clusters under the
     * `pin-clustered` theme.
     *
     * @remarks
     * Replaces the cluster icon entirely when a cluster spans multiple POI
     * categories — the count circle takes the centre with
     * {@link clusterMixedCount} rendered on top. Filter is an "all clusters
     * with a mixed dedup-concat" check so single-category clusters fall
     * through to {@link cluster} + {@link clusterBadge} instead.
     */
    clusterMixedBadge?: Partial<ToBeAddedLayerSpecTemplate<CircleLayerSpecification>>;

    /**
     * Cluster count text on top of {@link clusterMixedBadge}.
     *
     * @remarks
     * Centred count for mixed-category clusters; mirrors
     * {@link clusterCount} but with no translate so it lands inside the
     * centred badge.
     */
    clusterMixedCount?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
} & HasAdditionalLayersConfig;

/**
 * @group Places
 */
export type PlaceLayerName = keyof PlaceLayersConfig;

/**
 * Describes a single connection between two places, to be rendered as a line on the map.
 *
 * @remarks
 * Each endpoint can be given either as a full {@link Place} object or as the `id` of a
 * place that is currently displayed by the {@link PlacesModule} (via `show()`). When an
 * id is given, the module resolves it against its currently shown places to obtain the
 * coordinates; connections referencing unknown ids are silently skipped.
 *
 * Extra arbitrary properties are preserved on the connection and passed to the optional
 * label function, making it easy to render metadata such as distance or travel time
 * along the line.
 *
 * @example
 * ```typescript
 * const connection: PlaceConnectionDisplay = {
 *   from: stationPlace,        // full Place object
 *   to: 'cafe-id-123',         // or a shown place's id
 *   distanceMeters: 420        // extra metadata available to the label function
 * };
 * ```
 *
 * @group Places
 */
export type PlaceConnectionDisplay = {
    /**
     * The first endpoint of the connection. Either a Place object or the id of a
     * place currently shown by the module.
     */
    from: Place | string;

    /**
     * The second endpoint of the connection. Either a Place object or the id of a
     * place currently shown by the module.
     */
    to: Place | string;

    /**
     * Optional stable id for this connection. When omitted, an id is generated.
     */
    id?: string;

    /**
     * Arbitrary extra metadata, preserved on the connection and passed to the label
     * function.
     */
    [key: string]: unknown;
};

/**
 * MapLibre layer customization for connection lines and labels.
 *
 * @remarks
 * The layer IDs are derived from the PlacesModule instance prefix plus the key suffix:
 * - `line`: the connection line (default: dashed)
 * - `label`: the text label placed along the line
 *
 * @group Places
 */
export type PlaceConnectionsLayersConfig = {
    /**
     * Connection line layer specification.
     */
    line?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;

    /**
     * Connection label layer specification.
     */
    label?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
};

/**
 * @group Places
 */
export type PlaceConnectionLayerName = keyof PlaceConnectionsLayersConfig;

/**
 * Configuration for rendering connection lines between places.
 *
 * @remarks
 * Controls the appearance of connection lines, the optional label drawn along each
 * line, and MapLibre layer overrides.
 *
 * @example
 * ```typescript
 * const config: PlacesModuleConfig = {
 *   connections: {
 *     label: (connection) => `${connection.distanceMeters} m`,
 *     layers: {
 *       line: { paint: { 'line-color': '#3f9cd9' } }
 *     }
 *   }
 * };
 * ```
 *
 * @group Places
 */
export type PlaceConnectionsConfig = {
    /**
     * Function returning the text to display along the connection line.
     *
     * @remarks
     * Receives the original {@link PlaceConnectionDisplay} (including any custom
     * metadata). When omitted, no label is rendered.
     */
    label?: (connection: PlaceConnectionDisplay) => string;

    /**
     * Custom MapLibre layer specifications for connection line and label.
     */
    layers?: PlaceConnectionsLayersConfig;
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
 *     categoryIcons: [
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
 *     category: (place) => place.properties.poi?.localizedCategories?.[0],
 *     hasParking: (place) => place.properties.poi?.name?.includes('parking')
 *   }
 * };
 * ```
 *
 * @group Places
 */
export type PlacesModuleConfig = MapModuleCommonConfig & {
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
     * Configuration for EV charging station availability display.
     *
     * @remarks
     * Disabled by default - set `enabled: true` to show availability on EV stations.
     * Requires calling {@link getPlacesWithEVAvailability} to fetch availability data.
     *
     * @default undefined (disabled)
     */
    evAvailability?: EVAvailabilityConfig;

    /**
     * Configuration for connection lines drawn between places via
     * {@link PlacesModule.showConnections}.
     *
     * @remarks
     * When omitted, connections rendered via `showConnections` use default styling
     * (a dashed line) and no label.
     */
    connections?: PlaceConnectionsConfig;

    /**
     * Additional properties to compute for each place feature.
     *
     * These properties are added to the feature and can be used in styling expressions
     * or event handlers. Values can be static or computed from place data.
     *
     * @remarks
     * Useful for:
     * - Adding computed flags for conditional styling via 'layers' config.
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
