import {
    LayersSpecWithOrder,
    mapStyleLayerIDs,
    ROUTE_DESELECTED_LINE_LAYER_ID,
    ROUTE_DESELECTED_OUTLINE_LAYER_ID,
    ROUTE_FERRIES_LINE_LAYER_ID,
    ROUTE_FERRIES_SYMBOL_LAYER_ID,
    ROUTE_INCIDENTS_BACKGROUND_LAYER_ID,
    ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID,
    ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID,
    ROUTE_INCIDENTS_SYMBOL_LAYER_ID,
    ROUTE_LINE_LAYER_ID,
    ROUTE_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_SYMBOL,
    ROUTE_TUNNELS_LINE_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
    WAYPOINT_LABELS_LAYER_ID,
    WAYPOINT_SYMBOLS_LAYER_ID
} from "../../shared";
import {
    routeVehicleRestrictedBackgroundLine,
    routeVehicleRestrictedDottedLine
} from "../layers/routeVehicleRestrictedLayers";
import { routeFerriesLine, routeFerriesSymbol } from "../layers/routeFerrySectionLayers";
import {
    routeDeselectedLine,
    routeDeselectedOutline,
    routeMainLine,
    routeOutline
} from "../layers/routeMainLineLayers";
import { routeTollRoadsOutline, routeTollRoadsSymbol } from "../layers/routeTollRoadLayers";
import {
    routeIncidentsBGLine,
    routeIncidentsDashedLine,
    routeIncidentsPatternLine,
    routeIncidentsSymbol
} from "../layers/routeTrafficSectionLayers";
import { routeTunnelsLine } from "../layers/routeTunnelSectionLayers";
import { waypointLabels, waypointSymbols } from "../layers/waypointLayers";

/**
 * Configuration for the route layers. Allows full control for all the route layers.
 * All the fields are optional, if you don't supply configuration default one will be used.
 */
export type RouteLayersConfig = {
    /**
     * Main line layers.
     */
    mainLine?: LayersSpecWithOrder;

    /**
     * Waypoint layers.
     */
    waypoint?: LayersSpecWithOrder;

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
};

/**
 * Default implementation of the route layers.
 */
export const DEFAULT_ROUTE_LAYERS_CONFIGURATION: RouteLayersConfig = {
    mainLine: {
        layers: [
            {
                id: ROUTE_DESELECTED_OUTLINE_LAYER_ID,
                layerSpec: routeDeselectedOutline,
                beforeID: mapStyleLayerIDs.lowestLabel
            },
            {
                id: ROUTE_DESELECTED_LINE_LAYER_ID,
                layerSpec: routeDeselectedLine,
                beforeID: mapStyleLayerIDs.lowestLabel
            },
            { id: ROUTE_OUTLINE_LAYER_ID, layerSpec: routeOutline, beforeID: mapStyleLayerIDs.lowestLabel },
            { id: ROUTE_LINE_LAYER_ID, layerSpec: routeMainLine, beforeID: mapStyleLayerIDs.lowestLabel }
        ]
    },
    waypoint: {
        layers: [
            { id: WAYPOINT_SYMBOLS_LAYER_ID, layerSpec: waypointSymbols },
            { id: WAYPOINT_LABELS_LAYER_ID, layerSpec: waypointLabels }
        ]
    },
    sections: {
        incident: {
            layers: [
                {
                    id: ROUTE_INCIDENTS_BACKGROUND_LAYER_ID,
                    layerSpec: routeIncidentsBGLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                },
                {
                    id: ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID,
                    layerSpec: routeIncidentsDashedLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                },
                {
                    id: ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID,
                    layerSpec: routeIncidentsPatternLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                },
                {
                    id: ROUTE_INCIDENTS_SYMBOL_LAYER_ID,
                    layerSpec: routeIncidentsSymbol,
                    beforeID: WAYPOINT_SYMBOLS_LAYER_ID
                }
            ]
        },
        ferry: {
            layers: [
                {
                    id: ROUTE_FERRIES_LINE_LAYER_ID,
                    layerSpec: routeFerriesLine,
                    beforeID: ROUTE_INCIDENTS_BACKGROUND_LAYER_ID
                },
                {
                    id: ROUTE_FERRIES_SYMBOL_LAYER_ID,
                    layerSpec: routeFerriesSymbol,
                    beforeID: ROUTE_INCIDENTS_SYMBOL_LAYER_ID
                }
            ]
        },
        tollRoad: {
            layers: [
                {
                    id: ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
                    layerSpec: routeTollRoadsOutline,
                    beforeID: ROUTE_DESELECTED_OUTLINE_LAYER_ID
                },
                {
                    id: ROUTE_TOLL_ROADS_SYMBOL,
                    layerSpec: routeTollRoadsSymbol,
                    beforeID: WAYPOINT_SYMBOLS_LAYER_ID
                }
            ]
        },
        tunnel: {
            layers: [
                {
                    id: ROUTE_TUNNELS_LINE_LAYER_ID,
                    layerSpec: routeTunnelsLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                }
            ]
        },
        vehicleRestricted: {
            layers: [
                {
                    id: ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
                    layerSpec: routeVehicleRestrictedBackgroundLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                },
                {
                    id: ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
                    layerSpec: routeVehicleRestrictedDottedLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                }
            ]
        }
    }
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
