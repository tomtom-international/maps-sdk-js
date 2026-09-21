import type { ChargingSpeed, ChargingStop, DisplayUnits, GetPositionEntryPointOption } from '@tomtom-org/maps-sdk/core';
import type {
    DataDrivenPropertyValueSpecification,
    LineLayerSpecification,
    SymbolLayerSpecification,
} from 'maplibre-gl';
import type {
    CustomImage,
    HasAdditionalLayersConfig,
    MapModuleCommonConfig,
    SVGIconStyleOptions,
    ToBeAddedLayerSpecTemplate,
} from '../../shared';
import type {
    DrawnSectionType,
    GeneratedSectionType,
    SectionDrawStyle,
    SectionKnobOf,
    SectionLinePattern,
} from '../layers/sectionRegistry';

/**
 * The MapLibre layer id of a generated section's line layer.
 *
 * @remarks
 * Derived from the section type, so `motorway` is drawn by `routeSectionMotorwayLine`.
 * @group Routing
 */
export type SectionLineLayerName<T extends GeneratedSectionType = GeneratedSectionType> =
    `routeSection${Capitalize<T>}Line`;

/**
 * The MapLibre layer id of a section's icon layer.
 *
 * @remarks
 * Added to a generated section as soon as `sections.<type>.icon` asks for one, so `motorway` draws
 * its icon through `routeSectionMotorwaySymbol`.
 * @group Routing
 */
export type SectionSymbolLayerName<T extends GeneratedSectionType = GeneratedSectionType> =
    `routeSection${Capitalize<T>}Symbol`;

/**
 * The MapLibre layer id drawing the signs of one generated section type.
 *
 * @remarks
 * Present for the types that post their own value on a sign, so `speedLimit` draws its signs
 * through `routeSectionSpeedLimitSign`.
 * @group Routing
 */
export type SectionSignLayerName<T extends GeneratedSectionType = GeneratedSectionType> =
    `routeSection${Capitalize<T>}Sign`;

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
     * Layer specifications for route sections, keyed by section type.
     *
     * @remarks
     * Each section is a subset of the route path, and every type the module draws has an entry
     * here — the same vocabulary as the semantic `sections` config, one tier down. This is the
     * escape hatch: use it when the knobs on `sections` are not enough and you need full MapLibre
     * control over the layers a section is drawn with.
     *
     * The generated types carry a line layer, and an icon layer once `sections.<type>.icon` asks
     * for one. The remaining five draw themselves with the hand-written layers documented below.
     */
    sections?: {
        [T in GeneratedSectionType]?: {
            [K in SectionLineLayerName<T>]?: Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>;
        } & {
            [K in SectionSymbolLayerName<T>]?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
        } & {
            [K in SectionSignLayerName<T>]?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
        } & HasAdditionalLayersConfig;
    } & {
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
        traffic?: {
            /**
             * Symbol layer used to mark the start of a jam on the route.
             *
             * @remarks
             * Focuses on displaying jams with delays.
             */
            routeIncidentJamSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
            /**
             * Symbol layer used to mark the cause of the start of an incident on the route.
             *
             * @remarks
             * Can display icons for accidents, roadworks, weather, or other incidents.
             */
            routeIncidentCauseSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
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
        } & HasAdditionalLayersConfig;

        /**
         * Layers for the `tollRoad` section type.
         *
         * @remarks
         * Marks the stretches of the route that cost money to drive, by any charging scheme:
         * per-use tolls, motorways that need a vignette, and urban road-charge zones.
         */
        tollRoad?: {
            /**
             * Symbol layer marking the charged stretches with an icon.
             *
             * @remarks
             * Defaults to the toll-plaza icon, which is the closest the base-map sprite offers to
             * a generic road-charge icon. Override it to distinguish the schemes yourself.
             */
            routeTollRoadSymbol?: Partial<ToBeAddedLayerSpecTemplate<SymbolLayerSpecification>>;
            /**
             * Line layer used to outline the charged stretches.
             *
             * @remarks
             * Typically styled to visually differentiate charged stretches from regular roads.
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
          fn: (stop: ChargingStop) => string;
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
     *
     * An entry's `offsetX`/`offsetY` shift that icon from the charging stop's coordinate.
     * They only take effect when the same entry also provides an `image`; an entry naming an
     * existing sprite icon by `id` alone ignores them.
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
    title?: DataDrivenPropertyValueSpecification<string>;
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
 * Route line thickness preset.
 *
 * @remarks
 * Controls the thickness of the main route line and its outline at all zoom levels.
 *
 * Available options:
 * - `"s"` - Thin line, suitable for dense or cluttered maps
 * - `"m"` - Default medium thickness
 * - `"l"` - Thick line, useful for high emphasis or accessibility
 *
 * @group Routing
 */
export type RouteWidth = 's' | 'm' | 'l';

/**
 * Route waypoint icon size preset.
 *
 * @remarks
 * Controls the scale of waypoint pin icons at all zoom levels.
 *
 * Available options:
 * - `"s"` - Small icons
 * - `"m"` - Default medium icons
 * - `"l"` - Large icons
 *
 * @group Routing
 */
export type RouteWaypointSize = 's' | 'm' | 'l';

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
     * The primary color applied to the route line, outline, and waypoint icons.
     *
     * @remarks
     * Use this to quickly brand the route to match your application style.
     * Affects the main selected route line foreground, the route outline (a darker shade
     * is derived automatically), and the waypoint icon fill.
     * Can be overwritten by more specific layer styling configurations.
     *
     * Available options:
     * - Any valid CSS color string (e.g., `"#FF0000"`, `"rgb(255,0,0)"`, `"red"`, etc.)
     */
    mainColor?: string;

    /**
     * Line thickness preset for the main route line and its outline.
     *
     * @remarks
     * Scales the route line width at all zoom levels using predefined profiles.
     * Can be overwritten by more specific layer styling configurations.
     *
     * @defaultValue `"m"`
     */
    routeWidth?: RouteWidth;

    /**
     * Icon size preset for route waypoint pins.
     *
     * @remarks
     * Scales the waypoint icon at all zoom levels using predefined profiles.
     * Can be overwritten by more specific layer styling configurations.
     *
     * @defaultValue `"m"`
     */
    waypointSize?: RouteWaypointSize;
};

/**
 * The icon drawn on a route section.
 *
 * @remarks
 * Backed by a symbol layer over the section's own source: the generated section types get one
 * added, and the types that already draw an icon (`ferry`, `tollRoad`) have theirs replaced.
 *
 * @group Routing
 */
export type SectionIconConfig = {
    /**
     * The id of an image in the loaded style's sprite, e.g. `poi-toll_plaza`. An id the sprite does
     * not carry draws nothing.
     */
    image: string;
    /**
     * Where the icon sits on the section.
     *
     * @remarks
     * - `center`: one icon at the middle of each section.
     * - `along`: icons repeated along the section.
     *
     * A section is a stretch of line, so there is no placement at its start: MapLibre places
     * symbols on a line either once at its centre or repeatedly along it.
     *
     * @defaultValue `"center"`
     */
    placement?: 'center' | 'along';
    /**
     * Icon scale, where `1` is the sprite image's own size.
     *
     * @defaultValue 1
     */
    size?: number;
};

// Every knob the section tier offers. What one type actually takes is a subset of these, named by
// its registry entry: `SectionDisplayConfig` picks them per type.
type SectionKnobs = {
    /**
     * Whether the section is drawn at all.
     *
     * @remarks
     * The default is per type, on one rule: a type draws itself when its stretches are sparse
     * along a route and consequential for the driver. `carTrain`, `ferry`, `lowEmissionZone`,
     * `tollRoad`, `tollVignette`, `traffic`, `tunnel` and `vehicleRestricted` do, until switched
     * off here, and so does `speedLimit`, which posts a sign per section rather than banding the
     * route. The rest wait to be asked — `motorway`, `urban` and `country` each run nearly a
     * route's whole length, so a band drawn for them buries the route line.
     */
    visible?: boolean;
    /**
     * Line colour, as any CSS colour string. Each section type has its own default; on a type
     * drawn with more than one line, this sets the principal one and the rest are derived from it.
     */
    color?: string;
    /**
     * Line opacity, 0 to 1. Sections default to partial opacity so the route line stays readable
     * underneath.
     */
    opacity?: number;
    /**
     * Line width preset. Defaults to the route's own width.
     */
    width?: RouteWidth;
    /**
     * Whether the section bands the route (`halo`) or stands in for the route line along its own
     * stretch (`inline`). This decides both where the section's line sits in the layer order and
     * how wide it is drawn. Each type defaults to the one it has always been drawn as.
     */
    style?: SectionDrawStyle;
    /**
     * Line pattern. Each type has its own default — the ones that mark a legal rather than a
     * physical property of the road are dashed, and `vehicleRestricted` is dotted.
     */
    pattern?: SectionLinePattern;
    /**
     * An icon drawn on the section. None of the generated types draws one by default.
     */
    icon?: SectionIconConfig;
    /**
     * The sign a section posts its own value on, for the one type whose information is a number
     * rather than a stretch: `speedLimit`.
     */
    sign?: SectionSignConfig;
};

/**
 * The unit a speed limit sign reads in.
 *
 * @group Routing
 */
export type SectionSignUnit = 'km/h' | 'mph';

/**
 * What a section's signs give way to when two symbols want the same spot.
 *
 * @remarks
 * MapLibre resolves symbol collisions from the topmost layer down, so the layer underneath is the
 * one that gives way.
 *
 * - `belowMapLabels` — the signs give way to everything, the base map's own labels included, so a
 *   sign never lands on a street or place name. Sparse maps, and the price of a tidy one: in a city
 *   the labels take most of the room. Affordable because a sign repeats along its stretch, so one
 *   dropped where a label sits reappears further along.
 * - `belowRouteIcons` — the signs give way to the route's own icons, each of which says something
 *   the road cannot, but take precedence over the base map's labels.
 * - `aboveRouteIcons` — the signs give way to nothing, for a map whose subject is the limits.
 *
 * @group Routing
 */
export type SectionSignPriority = 'belowMapLabels' | 'belowRouteIcons' | 'aboveRouteIcons';

/**
 * The sign a section type posts its own value on.
 *
 * @remarks
 * `speedLimit` is the one type that takes this, and a sign is the whole of what it draws — there
 * is no line along the stretch, because a line would mark every stretch that carries a limit
 * without ever saying what the limit is. {@link SectionDisplayConfig.visible} switches the signs
 * themselves.
 *
 * The sign follows the road rather than the reader. Where the route also carries `country`
 * sections, each sign takes the face, the unit and the numeral colour of the country its stretch
 * runs through: the white disc most of Europe posts on, the yellow one Sweden, Finland and Iceland
 * use, the `SPEED LIMIT` plaque of the United States, and Japan's blue numerals. A country with no
 * entry posts the white disc in km/h.
 *
 * Where mph is posted the number is converted and rounded to the step signs come in. Without
 * `country` sections the display units decide the face and the unit, and an explicit {@link unit}
 * overrides both.
 *
 * Signs scale with the zoom, as the ferry and toll-road icons do; {@link minzoom} decides how early
 * they appear at all.
 *
 * @group Routing
 */
export type SectionSignConfig = {
    /**
     * The lowest zoom the signs are drawn at.
     *
     * @defaultValue 9, the zoom at which a sign is about a stretch of road a reader can see. Over
     * a whole country the stretches fall in the same few pixels, so the few signs that survive the
     * collision are an arbitrary sample rather than the limits of the drive.
     */
    minzoom?: number;
    /**
     * Whether a sign gives way to the other icons the route draws, or takes precedence over them.
     *
     * @defaultValue `'belowRouteIcons'`
     */
    priority?: SectionSignPriority;
    /**
     * The unit every sign reads in, whatever the road posts.
     *
     * @remarks
     * Left out, each sign follows its own country, or the display units where the route carries no
     * `country` sections.
     */
    unit?: SectionSignUnit;
};

/**
 * Appearance of one route section type.
 *
 * @remarks
 * The semantic tier for sections: enough to draw, recolour, resize or mute any section type the
 * module draws, without writing a MapLibre layer spec — see {@link DrawnSectionType} for the
 * types, and `layers.sections` for anything these knobs cannot express.
 *
 * Which knobs a type takes is part of its type. `traffic` colours its line by `magnitudeOfDelay`
 * and takes its icons from the incident data, so `sections.traffic.color` does not compile rather
 * than compiling and drawing nothing. {@link sectionSupportsKnob} answers the same question at
 * runtime, for a UI that builds its controls from the type.
 *
 * @example
 * ```typescript
 * const config: RoutingModuleConfig = {
 *   sections: {
 *     // Opt in to two of the sections nothing draws by default:
 *     urban: { visible: true },
 *     lowEmissionZone: { visible: true, color: '#1B7A43', opacity: 0.8 },
 *     // Restyle two that are drawn already:
 *     tunnel: { color: '#402060', style: 'halo' },
 *     tollRoad: { icon: { image: 'poi-toll_plaza', placement: 'along' } },
 *     // And drop one:
 *     traffic: { visible: false },
 *   },
 * };
 * ```
 *
 * @group Routing
 */
export type SectionDisplayConfig<T extends DrawnSectionType = DrawnSectionType> = Pick<SectionKnobs, SectionKnobOf<T>>;

/**
 * Appearance of every route section type, keyed by type.
 *
 * @group Routing
 */
export type SectionsDisplayConfig = { [T in DrawnSectionType]?: SectionDisplayConfig<T> };

/**
 * Configuration options for the routing module.
 *
 * @remarks
 * Provides customization options for route visualization and behavior,
 * including display units, waypoint handling, and layer styling.
 *
 * @group Routing
 */
export type RoutingModuleConfig = MapModuleCommonConfig & {
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
     * Configuration for the route summary bubbles displayed on the map.
     *
     * @remarks
     * Summary bubbles show key route information (distance, duration, traffic delay)
     * as visual overlays positioned along the route.
     */
    summaryBubbles?: {
        /**
         * Controls the visibility of route summary bubbles on the map.
         *
         * @defaultValue true
         */
        visible?: boolean;
    };

    /**
     * Appearance of the route sections, keyed by section type.
     *
     * @remarks
     * Covers every section type the module draws, on the same knobs: draw it or not, its colour,
     * opacity, width, whether it bands the route or stands in for its line, its line pattern and
     * its icon.
     *
     * The types whose stretches are sparse and consequential draw themselves — `carTrain`,
     * `ferry`, `lowEmissionZone`, `tollRoad`, `tollVignette`, `traffic`, `tunnel` and
     * `vehicleRestricted` — and switch off with `{ visible: false }`. The rest switch on with
     * `{ visible: true }`: a type covering most of a route buries the route line.
     *
     * `layers.sections` takes full MapLibre layer specs for the same types, for anything these
     * knobs cannot express.
     */
    sections?: SectionsDisplayConfig;

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
