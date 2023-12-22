import { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { GeoJSONSourceWithLayers, LayersSpecWithOrder, ToBeAddedLayerSpecWithoutSource } from "../../shared";
import { Routes, Waypoints } from "@anw/maps-sdk-js/core";
import { DisplayRouteProps } from "./displayRoutes";
import { DisplayTrafficSectionProps, RouteSections } from "./routeSections";
import { DisplayInstructionArrows, DisplayInstructions } from "./guidance";

/**
 * Configuration for the route layers. Allows full control for all the route layers.
 * * All the fields are optional: if you don't supply one, then its default will be used.
 */
export type RouteLayersConfig = {
    /**
     * Main line layers.
     */
    mainLine?: LayersSpecWithOrder<LineLayerSpecification>;

    /**
     * Waypoint layers.
     */
    waypoints?: LayersSpecWithOrder<SymbolLayerSpecification>;

    /**
     * Layer specifications for the sections.
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
};

/**
 * Parameters for the routing module.
 */
export type RoutingModuleConfig = {
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
    routeLines: GeoJSONSourceWithLayers<Routes<DisplayRouteProps>>;
    // route sections:
    vehicleRestricted: GeoJSONSourceWithLayers<RouteSections>;
    incidents: GeoJSONSourceWithLayers<RouteSections<DisplayTrafficSectionProps>>;
    ferries: GeoJSONSourceWithLayers<RouteSections>;
    evChargingStations: GeoJSONSourceWithLayers<Waypoints>;
    tollRoads: GeoJSONSourceWithLayers<RouteSections>;
    tunnels: GeoJSONSourceWithLayers<RouteSections>;
    instructionLines: GeoJSONSourceWithLayers<DisplayInstructions>;
    instructionArrows: GeoJSONSourceWithLayers<DisplayInstructionArrows>;
};

/**
 * @ignore
 */
export type RoutingLayersSpecs = Record<keyof RoutingSourcesWithLayers, ToBeAddedLayerSpecWithoutSource[]>;
