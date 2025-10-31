import type { ChargingSpeed, ChargingStop, DisplayUnits, GetPositionEntryPointOption } from '@tomtom-org/maps-sdk/core';
import type { ExpressionSpecification, LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import { CustomImage, SVGIconStyleOptions, ToBeAddedLayerSpecTemplate } from '../../shared';

export type HasAdditionalLayersConfig = {
    /**
     * Additional custom layers to be added alongside the predefined ones.
     *
     * @remarks
     * Allows for further customization by specifying extra layers that
     * complement the standard route visualization layers.
     *
     * Use these if you want to add extra visuals to a specific route part, be it lines, or symbols.
     *
     * You can define 'beforeID' in the additional layers to place them under predefined ones (or other of your additional layers).
     */
    additional?: Record<string, ToBeAddedLayerSpecTemplate<LineLayerSpecification | SymbolLayerSpecification>>;
};

/**
 * Detailed configuration for the visual appearance of route layers on the map with the MapLibre specification.
 *
 * @remarks
 * Provides fine-grained control over all route visualization layers, including
 * main route lines, waypoints, route sections (ferry, tunnel, toll roads, etc.),
 * turn-by-turn guidance instructions, and route summaries.
 *
 * All fields are optional. When a field is not provided, the default styling will be used.
 *
 * @group Routing
 */
export type RouteLayersConfig = {
    /**
     * Main route line layer specifications.
     *
     * @remarks
     * Defines the visual styling for the primary route path displayed on the map.
     * Can include both line and symbol layers for enhanced visualization.
     */
    mainLines?: {
        /**
         * Styling for the primary, selected route line.
         *
         * @remarks
         * Controls the visual appearance of the active route's line (color, width, dash pattern, etc.).
         */
        routeLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        /**
         * Styling for the outline (stroke) around the primary route line.
         *
         * @remarks
         * Typically used to create contrast between the route and map background.
         */
        routeOutline?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        /**
         * Styling for the deselected (inactive) route line.
         *
         * @remarks
         * Used when multiple routes are shown and some are visually de-emphasized.
         */
        routeDeselectedLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        /**
         * Styling for the outline around the deselected route line.
         *
         * @remarks
         * Matches `routeDeselectedLine` but provides an outer stroke for visibility.
         */
        routeDeselectedOutline?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        /**
         * Symbol layer that renders directional arrows along the main route.
         *
         * @remarks
         * Arrows can help indicate travel direction along routes with complex geometry.
         */
        routeLineArrows?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
    } & HasAdditionalLayersConfig;

    /**
     * Waypoint layer specifications.
     *
     * @remarks
     * Controls the appearance of waypoint icons (origin, destination, and intermediate stops)
     * and their labels along the route.
     */
    waypoints?: {
        /**
         * Symbol layer for waypoint icons (origin, destination, stops).
         *
         * @remarks
         * Customize icons, sizes, and placement for waypoints using this layer.
         */
        routeWaypointSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
        /**
         * Symbol layer for waypoint labels displayed next to waypoint icons.
         *
         * @remarks
         * Controls label text, font, and offset for waypoint annotations.
         */
        routeWaypointLabel?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
    } & HasAdditionalLayersConfig;

    /**
     * Electric vehicle charging station section layers.
     *
     * @remarks
     * Marks charging stop locations along routes calculated for electric vehicles.
     *
     * Charging stops are individual points which are originally extracted from leg sections.
     */
    chargingStops?: {
        /**
         * Symbol layer for rendering charging stop icons on the map.
         *
         * @remarks
         * Use this layer to control icon image, size, and placement for charging stops.
         */
        routeChargingStopSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
    } & HasAdditionalLayersConfig;

    /**
     * Layer specifications for specialized route sections.
     *
     * @remarks
     * Each section is a subset of the route path.
     *
     * Different types of road sections along the route can be styled individually
     * to highlight specific characteristics or conditions.
     */
    sections?: {
        /**
         * Ferry crossing section layers.
         *
         * @remarks
         * Styles the portions of the route that involve ferry transportation.
         */
        ferry?: {
            /**
             * Symbol layer used to mark ferry boarding/alighting points.
             *
             * @remarks
             * Typically used for icons at terminals or specific waypoints along the ferry section.
             */
            routeFerrySymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
            /**
             * Line layer used to style the ferry crossing path.
             *
             * @remarks
             * Often drawn differently (e.g., dashed or patterned) to indicate ferry travel.
             */
            routeFerryLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & HasAdditionalLayersConfig;

        /**
         * Traffic incident section layers.
         *
         * @remarks
         * Highlights route segments affected by traffic incidents or disruptions.
         */
        incident?: {
            /**
             * Symbol layer used to mark the location of an incident on the route.
             *
             * @remarks
             * Can display icons for accidents, roadworks, or other incidents.
             */
            routeIncidentSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
            /**
             * Line layer used to draw the incident's background/highlight.
             *
             * @remarks
             * Provides a contrasting background line to make incident segments stand out.
             */
            routeIncidentBackgroundLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
            /**
             * Line layer used to draw dashed styling for incident segments.
             *
             * @remarks
             * Useful for indicating partial closures or advisory segments.
             */
            routeIncidentDashedLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
            /**
             * Line layer used to apply pattern-based styling for incident segments.
             *
             * @remarks
             * Allows use of image patterns or custom line patterns for emphasis.
             */
            routeIncidentPatternLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & HasAdditionalLayersConfig;

        /**
         * Toll road section layers.
         *
         * @remarks
         * Identifies route segments that require toll payments.
         */
        tollRoad?: {
            /**
             * Symbol layer for marking toll booths or toll segments.
             *
             * @remarks
             * Use for icons or markers indicating toll-related points along the route.
             */
            routeTollRoadSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
            /**
             * Line layer used to outline toll road segments.
             *
             * @remarks
             * Typically styled to visually differentiate toll segments from regular roads.
             */
            routeTollRoadOutline?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & HasAdditionalLayersConfig;

        /**
         * Tunnel section layers.
         *
         * @remarks
         * Highlights route segments that pass through tunnels.
         */
        tunnel?: {
            /**
             * Line layer used to style tunnel segments along the route.
             *
             * @remarks
             * Often drawn with a distinct color or transparency to denote tunnels.
             */
            routeTunnelLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & HasAdditionalLayersConfig;

        /**
         * Vehicle-restricted section layers.
         *
         * @remarks
         * Indicates route segments with vehicle access restrictions.
         */
        vehicleRestricted?: {
            /**
             * Background line layer for vehicle-restricted segments.
             *
             * @remarks
             * Provides a base styling to make restriction segments visible.
             */
            routeVehicleRestrictedBackgroundLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
            /**
             * Foreground line layer for vehicle-restricted segments.
             *
             * @remarks
             * Drawn on top of the background to emphasize the restriction area.
             */
            routeVehicleRestrictedForegroundLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & HasAdditionalLayersConfig;
    };

    /**
     * Turn-by-turn instruction line layers.
     *
     * @remarks
     * Visual representation of individual maneuver segments in the guidance instructions.
     */
    instructionLines?: {
        /**
         * Line layer for the outline around instruction segments.
         *
         * @remarks
         * Used to make instruction segments readable over complex map backgrounds.
         */
        routeInstructionOutline?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        /**
         * Line layer for the instruction segment itself.
         *
         * @remarks
         * Represents the precise geometry of the maneuver for which an instruction is shown.
         */
        routeInstructionLine?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
    } & HasAdditionalLayersConfig;

    /**
     * Turn-by-turn instruction arrow layers.
     *
     * @remarks
     * Directional arrows indicating the direction of travel for each maneuver.
     */
    instructionArrows?: {
        /**
         * Symbol layer for instruction/direction arrows placed along maneuver segments.
         *
         * @remarks
         * Controls arrow icon, rotation, and placement relative to the instruction geometry.
         */
        routeInstructionArrowSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
    } & HasAdditionalLayersConfig;

    /**
     * Route summary information bubble layers.
     *
     * @remarks
     * Displays summary information (e.g., total distance, estimated time) for the route.
     */
    summaryBubbles?: {
        /**
         * Symbol layer for the route summary bubble icon and label.
         *
         * @remarks
         * Use this layer to style the small summary popups or badges shown on the route.
         */
        routeSummaryBubbleSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
    } & HasAdditionalLayersConfig;
};

/**
 * Mapping of charging stop speeds to sprite image IDs.
 * @group Routing
 */
export type ChargingSpeedIconMapping = Record<ChargingSpeed, string>;

/**
 * Function type for mapping a value to a string, typically used for icon sprite IDs.
 *
 * @typeParam T - The type of the input value to be mapped to a string.
 * @param key - The input value to map.
 * @returns The string representation or sprite image ID for the given value.
 * @group Routing
 */
export type ToStringFn<T> = (key: T) => string;

/**
 * Mapping between charging stop properties and the corresponding icon sprite IDs.
 * @group Routing
 */
export type ChargingStopIconMapping =
    | {
          /**
           * Determines the icon based on the charging speed of the charging connector.
           */
          basedOn: 'chargingSpeed';
          /**
           * Mapping from charging speeds to sprite image IDs.
           */
          value: ChargingSpeedIconMapping;
      }
    | {
          /**
           * Determines the icon based on a custom function.
           */
          basedOn: 'custom';
          /**
           * The function which maps a ChargingStop to a sprite image ID.
           */
          fn: ToStringFn<ChargingStop>;
      };

/**
 * Icon display configuration for charging stops along the route.
 *
 * @group Routing
 */
export type ChargingStopIconConfig = {
    /**
     * Optional custom icons to be added to the map style for charging stops.
     *
     * @remarks
     * These icons can be referenced in the `mapping` configuration to customize
     * the appearance of charging stop markers based on specific criteria.
     */
    customIcons?: CustomImage[];

    /**
     * Mapping configuration, from charging stop objects to sprite image IDs.
     *
     * @remarks
     * Defines how to select the appropriate icon for each charging stop based on
     * its properties, such as charging speed or a custom mapping function.
     * Does not necessary require custom icons to be provided.
     * If not provided, default icons will be used.
     */
    mapping?: ChargingStopIconMapping;
};

/**
 * Text display configuration for charging stops along the route.
 *
 * @remarks
 * Controls the visibility and content of text labels associated with charging stop markers.
 *
 * @group Routing
 */
export type ChargingStopTextConfig = {
    /**
     * Controls the visibility of text labels for charging stops.
     *
     * @defaultValue true
     */
    visible?: boolean;
    /**
     * Custom content/display configuration for the charging stop title.
     *
     * @remarks
     * Defines how the title text for charging stops is formatted and displayed.
     * Can include MapLibre formatted expressions for dynamic content generation.
     *
     * @see https://maplibre.org/maplibre-style-spec/types/#formatted
     */
    title?: ExpressionSpecification;
};

/**
 * Display configuration for charging stops along the route.
 *
 * @remarks
 * Controls visibility, iconography, and text labels for charging stops on the map.
 *
 * @group Routing
 */
export type ChargingStopsConfig = {
    /**
     * Controls the overall visibility of charging stop icons and labels on the map.
     * @defaultValue true
     */
    visible?: boolean;
    /**
     * Display configuration for charging stop text labels.
     *
     * @remarks
     * Can control both content and display properties of the text shown next to charging stop icons.
     */
    text?: ChargingStopTextConfig;
    /**
     * Display configuration for charging stop icons.
     */
    icon?: ChargingStopIconConfig;
};

/**
 * Configuration for controlling waypoint data sources and display behavior.
 *
 * @remarks
 * Determines how waypoint position data is processed when rendering waypoints on the map,
 * particularly in relation to entry point information.
 *
 * @group Routing
 */
export type WaypointsConfig = {
    /**
     * Icon display configuration for waypoints.
     *
     * @remarks
     * Allows customization of the visual style for waypoint icons (origin, destination, stops) on the map.
     *
     */
    icon?: {
        /**
         * Base style options for the SVG waypoint icon.
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
    };

    /**
     * Controls how entry points are used when displaying waypoints on the map.
     *
     * @remarks
     * Entry points represent the actual navigable entrance to a location,
     * which may differ from the geometric center coordinates.
     *
     * Available options:
     * - `main-when-available` - Uses the main entry point coordinates when available, falling back to the waypoint coordinates
     * - `ignore` - Always uses the original waypoint coordinates
     *
     * @defaultValue `"ignore"`
     */
    entryPoints?: GetPositionEntryPointOption;
};

/**
 * Generic styling for route visualization.
 *
 * @remarks
 * * Provides high-level theming options for route appearance.
 * * Can be overwritten by more specific layer styling configurations.
 *
 * @group Routing
 */
export type RouteTheme = {
    /**
     * The overall main color for the route waypoints and main lines.
     * * Use this to quickly theme the route appearance to match your application style.
     *
     * @remarks
     * * Can be overwritten by more specific configuration options which target color of specific layers.
     *
     * Available options:
     * - Any valid CSS color string (e.g., `"#FF0000"`, `"rgb(255,0,0)"`, `"red"`, etc.)
     */
    mainColor?: string;
};

/**
 * Configuration options for the routing module.
 *
 * @remarks
 * Provides customization options for route visualization and behavior,
 * including display units, waypoint handling, and layer styling.
 *
 * @group Routing
 */
export type RoutingModuleConfig = {
    /**
     * Units for displaying distances in route summaries and instructions.
     *
     * @remarks
     * Overrides the global configuration setting for display units.
     * Affects distance values shown in route summaries and turn-by-turn instructions.
     *
     * Available options:
     * - `metric` - Kilometers and meters
     * - `imperial` - Miles and feet
     *
     * @defaultValue `"metric"`
     */
    displayUnits?: DisplayUnits;

    /**
     * Main styling configuration for the route visualization.
     *
     * @remarks
     * * Provides high-level styling options that affect the overall appearance of the route,
     * such as the primary color used for route lines and waypoints.
     * * Can be overwritten by more specific layer styling configurations.
     */
    theme?: RouteTheme;

    /**
     * Configuration for the waypoints source and layers to display them on the map.
     *
     * @remarks
     * Controls how waypoint source data and/or layer configs are processed to rendering them the map.
     */
    waypoints?: WaypointsConfig;

    /**
     * Configuration for the charging stops source and layers to display them on the map.
     *
     * @remarks
     * Controls how charging stops source data and/or layer configs are processed to rendering them the map.
     */
    chargingStops?: ChargingStopsConfig;

    /**
     * Custom layer styling configuration.
     *
     * @remarks
     * * Overrides the default layer styling with custom specifications.
     * * You must provide complete layer specifications for any layers you wish to customize.
     * * You can still reuse the default configurations if you want incremental changes. See: defaultRoutingLayers.
     * * Any layer not specified will continue to use its default styling.
     * * Use this only if you need fine MapLibre control on how some parts of the route are displayed.
     */
    layers?: RouteLayersConfig;
};
