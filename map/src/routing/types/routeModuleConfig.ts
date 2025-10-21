import type { DisplayUnits, GetPositionEntryPointOption, Routes, Waypoints } from '@cet/maps-sdk-js/core';
import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { GeoJSONSourceWithLayers, LayerSpecsWithOrder, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import type { DisplayRouteProps, DisplayRouteSummaries } from './displayRoutes';
import type { DisplayInstructionArrows, DisplayInstructions } from './guidance';
import type { DisplayTrafficSectionProps, RouteSections } from './routeSections';
import type { WaypointDisplayProps } from './waypointDisplayProps';

/**
 * Configuration for customizing the visual appearance of route layers on the map.
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
    mainLines?: LayerSpecsWithOrder<LineLayerSpecification | SymbolLayerSpecification>;

    /**
     * Waypoint marker layer specifications.
     *
     * @remarks
     * Controls the appearance of waypoint icons (origin, destination, and intermediate stops)
     * along the route.
     */
    waypoints?: LayerSpecsWithOrder<SymbolLayerSpecification>;

    /**
     * Layer specifications for specialized route sections.
     *
     * @remarks
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
        ferry?: LayerSpecsWithOrder;

        /**
         * Traffic incident section layers.
         *
         * @remarks
         * Highlights route segments affected by traffic incidents or disruptions.
         */
        incident?: LayerSpecsWithOrder;

        /**
         * Electric vehicle charging station section layers.
         *
         * @remarks
         * Marks charging stop locations along routes calculated for electric vehicles.
         */
        evChargingStations?: LayerSpecsWithOrder;

        /**
         * Toll road section layers.
         *
         * @remarks
         * Identifies route segments that require toll payments.
         */
        tollRoad?: LayerSpecsWithOrder;

        /**
         * Tunnel section layers.
         *
         * @remarks
         * Highlights route segments that pass through tunnels.
         */
        tunnel?: LayerSpecsWithOrder;

        /**
         * Vehicle-restricted section layers.
         *
         * @remarks
         * Indicates route segments with vehicle access restrictions.
         */
        vehicleRestricted?: LayerSpecsWithOrder;
    };

    /**
     * Turn-by-turn instruction line layers.
     *
     * @remarks
     * Visual representation of individual maneuver segments in the guidance instructions.
     */
    instructionLines?: LayerSpecsWithOrder;

    /**
     * Turn-by-turn instruction arrow layers.
     *
     * @remarks
     * Directional arrows indicating the direction of travel for each maneuver.
     */
    instructionArrows?: LayerSpecsWithOrder;

    /**
     * Route summary information bubble layers.
     *
     * @remarks
     * Displays summary information (e.g., total distance, estimated time) for the route.
     */
    summaryBubbles?: LayerSpecsWithOrder;
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
export type WaypointsSourceConfig = {
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
     * Configuration for the waypoints data source.
     *
     * @remarks
     * Controls how waypoint position data is processed before rendering on the map.
     */
    waypointsSource?: WaypointsSourceConfig;

    /**
     * Custom layer styling configuration.
     *
     * @remarks
     * Overrides the default layer styling with custom specifications.
     * Any layer not specified will continue to use its default styling.
     */
    layers?: RouteLayersConfig;
};

/**
 * @ignore
 */
export type RoutingSourcesWithLayers = {
    waypoints: GeoJSONSourceWithLayers<Waypoints<WaypointDisplayProps>>;
    mainLines: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    // route sections:
    vehicleRestricted: GeoJSONSourceWithLayers<RouteSections>;
    incidents: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    ferries: GeoJSONSourceWithLayers<RouteSections>;
    evChargingStations: GeoJSONSourceWithLayers<Waypoints>;
    tollRoads: GeoJSONSourceWithLayers<RouteSections>;
    tunnels: GeoJSONSourceWithLayers<RouteSections>;
    instructionLines: GeoJSONSourceWithLayers<DisplayInstructions>;
    instructionArrows: GeoJSONSourceWithLayers<DisplayInstructionArrows>;
    summaryBubbles: GeoJSONSourceWithLayers<DisplayRouteSummaries>;
};

/**
 * @ignore
 */
export type RoutingLayersSpecs = Record<keyof RoutingSourcesWithLayers, ToBeAddedLayerSpecWithoutSource[]>;
