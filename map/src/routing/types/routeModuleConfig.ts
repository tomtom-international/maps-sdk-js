import type { DisplayUnits, GetPositionEntryPointOption, Routes, Waypoints } from '@cet/maps-sdk-js/core';
import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { GeoJSONSourceWithLayers, LayerSpecsWithOrder, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import type { DisplayRouteProps, DisplayRouteSummaries } from './displayRoutes';
import type { DisplayInstructionArrows, DisplayInstructions } from './guidance';
import type { DisplayTrafficSectionProps, RouteSections } from './routeSections';
import type { WaypointDisplayProps } from './waypointDisplayProps';

/**
 * Configuration for the route layers. Allows full control for all the route layers.
 * * All the fields are optional: if you don't supply one, then its default will be used.
 */
export type RouteLayersConfig = {
    /**
     * Main route line layers.
     */
    mainLines?: LayerSpecsWithOrder<LineLayerSpecification | SymbolLayerSpecification>;

    /**
     * Waypoint layers.
     */
    waypoints?: LayerSpecsWithOrder<SymbolLayerSpecification>;

    /**
     * Layer specifications for the route sections.
     */
    sections?: {
        /**
         * Ferry section layers.
         */
        ferry?: LayerSpecsWithOrder;
        /**
         * Incident section layers.
         */
        incident?: LayerSpecsWithOrder;
        /**
         * Legs section layers, for EV routing.
         */
        evChargingStations?: LayerSpecsWithOrder;
        /**
         * Toll road section layers.
         */
        tollRoad?: LayerSpecsWithOrder;
        /**
         * Tunnel section layers.
         */
        tunnel?: LayerSpecsWithOrder;
        /**
         * Incident vehicle restricted layers.
         */
        vehicleRestricted?: LayerSpecsWithOrder;
    };

    /**
     * Route guidance instruction lines.
     */
    instructionLines?: LayerSpecsWithOrder;
    /**
     * Route guidance instruction arrows.
     */
    instructionArrows?: LayerSpecsWithOrder;
    /**
     * Route summary bubbles.
     */
    summaryBubbles?: LayerSpecsWithOrder;
};

export type WaypointsSourceConfig = {
    /**
     * Option to control how entry points are used when displaying waypoints on the map.
     * * main-when-available: the waypoint coordinates will be replaced with the main entry point coordinates if available.
     * * ignore: the waypoint coordinates will be used as is.
     * @default ignore
     */
    entryPoints?: GetPositionEntryPointOption;
};

/**
 * Parameters for the routing module.
 */
export type RoutingModuleConfig = {
    /**
     * Custom units to format distances where applicable.
     * * Overrides the global configuration ones.
     * @default "metric"
     */
    displayUnits?: DisplayUnits;

    /**
     * Configuration for the waypoints source, allowing to control the data used to display waypoints.
     */
    waypointsSource?: WaypointsSourceConfig;

    /**
     * Overrides default layers configuration with the one supplied here.
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
