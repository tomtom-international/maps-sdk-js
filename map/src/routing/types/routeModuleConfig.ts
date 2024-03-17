import type { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import type { GeoJSONSourceWithLayers, LayersSpecWithOrder, ToBeAddedLayerSpecWithoutSource } from "../../shared";
import type { DistanceUnitsType, Routes, Waypoints } from "@anw/maps-sdk-js/core";
import type { DisplayRouteProps, DisplayRouteSummaries } from "./displayRoutes";
import type { DisplayTrafficSectionProps, RouteSections } from "./routeSections";
import type { DisplayInstructionArrows, DisplayInstructions } from "./guidance";

/**
 * Configuration for the route layers. Allows full control for all the route layers.
 * * All the fields are optional: if you don't supply one, then its default will be used.
 */
export type RouteLayersConfig = {
    /**
     * Main route line layers.
     */
    mainLines?: LayersSpecWithOrder<LineLayerSpecification>;

    /**
     * Waypoint layers.
     */
    waypoints?: LayersSpecWithOrder<SymbolLayerSpecification>;

    /**
     * Layer specifications for the route sections.
     */
    sections?: {
        /**
         * Ferry section layers.
         */
        ferry?: LayersSpecWithOrder;
        /**
         * Incident section layers.
         */
        incident?: LayersSpecWithOrder;
        /**
         * Legs section layers, for EV routing.
         */
        evChargingStations?: LayersSpecWithOrder;
        /**
         * Toll road section layers.
         */
        tollRoad?: LayersSpecWithOrder;
        /**
         * Tunnel section layers.
         */
        tunnel?: LayersSpecWithOrder;
        /**
         * Incident vehicle restricted layers.
         */
        vehicleRestricted?: LayersSpecWithOrder;
    };

    /**
     * Route guidance instruction lines.
     */
    instructionLines?: LayersSpecWithOrder;
    /**
     * Route guidance instruction arrows.
     */
    instructionArrows?: LayersSpecWithOrder;
    /**
     * Route summary bubbles.
     */
    summaryBubbles?: LayersSpecWithOrder;
};

/**
 * Parameters for the routing module.
 */
export type RoutingModuleConfig = {
    /**
     * Units type to format distances where applicable.
     * @default "metric"
     */
    distanceUnits?: DistanceUnitsType;
    /**
     * Overrides default layers configuration with the one supplied here.
     */
    routeLayers?: RouteLayersConfig;
};

/**
 * @ignore
 */
export type RoutingSourcesWithLayers = {
    waypoints: GeoJSONSourceWithLayers<Waypoints>;
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
