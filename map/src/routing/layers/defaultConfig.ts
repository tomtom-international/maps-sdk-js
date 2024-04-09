import {
    mapStyleLayerIDs,
    ROUTE_DESELECTED_LINE_LAYER_ID,
    ROUTE_DESELECTED_OUTLINE_LAYER_ID,
    ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID,
    ROUTE_FERRIES_LINE_LAYER_ID,
    ROUTE_FERRIES_SYMBOL_LAYER_ID,
    ROUTE_INCIDENTS_BACKGROUND_LAYER_ID,
    ROUTE_INCIDENTS_DASHED_LINE_LAYER_ID,
    ROUTE_INCIDENTS_PATTERN_LINE_LAYER_ID,
    ROUTE_INCIDENTS_SYMBOL_LAYER_ID,
    ROUTE_INSTRUCTIONS_ARROW_LAYER_ID,
    ROUTE_INSTRUCTIONS_LINE_LAYER_ID,
    ROUTE_INSTRUCTIONS_OUTLINE_LAYER_ID,
    ROUTE_LINE_ARROWS_LAYER_ID,
    ROUTE_LINE_LAYER_ID,
    ROUTE_OUTLINE_LAYER_ID,
    ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID,
    ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_SYMBOL,
    ROUTE_TUNNELS_LINE_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
    WAYPOINT_LABELS_LAYER_ID,
    WAYPOINT_SYMBOLS_LAYER_ID
} from "../../shared";
import {
    routeDeselectedLine,
    routeDeselectedOutline,
    routeLineArrows,
    routeMainLine,
    routeOutline
} from "./routeMainLineLayers";
import { waypointLabels, waypointSymbols } from "./waypointLayers";
import {
    routeIncidentsBGLine,
    routeIncidentsDashedLine,
    routeIncidentsPatternLine,
    routeIncidentsSymbol
} from "./routeTrafficSectionLayers";
import { routeEVChargingStationSymbol } from "./evChargingStationLayers";
import { routeFerriesLine, routeFerriesSymbol } from "./routeFerrySectionLayers";
import { routeTollRoadsOutline, routeTollRoadsSymbol } from "./routeTollRoadLayers";
import { routeTunnelsLine } from "./routeTunnelSectionLayers";
import { routeVehicleRestrictedBackgroundLine, routeVehicleRestrictedDottedLine } from "./routeVehicleRestrictedLayers";
import { instructionArrow, instructionLine, instructionOutline } from "./guidanceLayers";
import type { RouteLayersConfig } from "../types/routeModuleConfig";
import { summaryBubbleSymbolPoint } from "./summaryBubbleLayers";

/**
 * Default implementation of the route layers.
 */
export const defaultRouteLayersConfig: Required<RouteLayersConfig> = {
    mainLines: {
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
            { id: ROUTE_LINE_LAYER_ID, layerSpec: routeMainLine, beforeID: mapStyleLayerIDs.lowestLabel },
            { id: ROUTE_LINE_ARROWS_LAYER_ID, layerSpec: routeLineArrows, beforeID: mapStyleLayerIDs.lowestLabel }
        ]
    },
    waypoints: {
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
                    beforeID: ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID
                }
            ]
        },
        evChargingStations: {
            layers: [
                {
                    id: ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID,
                    layerSpec: routeEVChargingStationSymbol,
                    beforeID: ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID
                }
            ]
        },
        ferry: {
            layers: [
                {
                    id: ROUTE_FERRIES_LINE_LAYER_ID,
                    layerSpec: routeFerriesLine,
                    beforeID: ROUTE_LINE_ARROWS_LAYER_ID
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
                    beforeID: ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID
                }
            ]
        },
        tunnel: {
            layers: [
                {
                    id: ROUTE_TUNNELS_LINE_LAYER_ID,
                    layerSpec: routeTunnelsLine,
                    beforeID: ROUTE_LINE_ARROWS_LAYER_ID
                }
            ]
        },
        vehicleRestricted: {
            layers: [
                {
                    id: ROUTE_VEHICLE_RESTRICTED_BACKGROUND_LAYER_ID,
                    layerSpec: routeVehicleRestrictedBackgroundLine,
                    beforeID: ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID
                },
                {
                    id: ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
                    layerSpec: routeVehicleRestrictedDottedLine,
                    beforeID: mapStyleLayerIDs.lowestLabel
                }
            ]
        }
    },
    instructionLines: {
        layers: [
            {
                id: ROUTE_INSTRUCTIONS_OUTLINE_LAYER_ID,
                layerSpec: instructionOutline,
                beforeID: mapStyleLayerIDs.lowestLabel
            },
            {
                id: ROUTE_INSTRUCTIONS_LINE_LAYER_ID,
                layerSpec: instructionLine,
                beforeID: mapStyleLayerIDs.lowestLabel
            }
        ]
    },
    instructionArrows: {
        layers: [
            {
                id: ROUTE_INSTRUCTIONS_ARROW_LAYER_ID,
                layerSpec: instructionArrow,
                beforeID: ROUTE_INSTRUCTIONS_LINE_LAYER_ID
            }
        ]
    },
    summaryBubbles: {
        layers: [
            {
                id: ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID,
                layerSpec: summaryBubbleSymbolPoint,
                beforeID: WAYPOINT_SYMBOLS_LAYER_ID
            }
        ]
    }
};
