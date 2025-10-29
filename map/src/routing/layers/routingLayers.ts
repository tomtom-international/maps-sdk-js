import { mapStyleLayerIDs } from '../../shared';
import type { RouteLayersConfig, RoutingModuleConfig } from '../types/routeModuleConfig';
import { chargingStopSymbol } from './chargingStopLayers';
import { instructionArrow, instructionLine, instructionOutline } from './guidanceLayers';
import { routeFerriesLine, routeFerriesSymbol } from './routeFerrySectionLayers';
import {
    routeDeselectedLine,
    routeDeselectedOutline,
    routeLineArrows,
    routeMainLine,
    routeOutline,
} from './routeMainLineLayers';
import { routeTollRoadsOutline, routeTollRoadsSymbol } from './routeTollRoadLayers';
import {
    routeIncidentsBGLine,
    routeIncidentsDashedLine,
    routeIncidentsPatternLine,
    routeIncidentsSymbol,
} from './routeTrafficSectionLayers';
import { routeTunnelsLine } from './routeTunnelSectionLayers';
import { routeVehicleRestrictedBackgroundLine, routeVehicleRestrictedDottedLine } from './routeVehicleRestrictedLayers';
import { summaryBubbleSymbolPoint } from './summaryBubbleLayers';
import { waypointLabels, waypointSymbols } from './waypointLayers';

/**
 * Generates the routing layers configuration for route visualization on the map.
 * @param config - Optional routing module configuration to customize layer properties.
 * @ignore
 */
export const buildRoutingLayers = (config: RoutingModuleConfig = {}): Required<RouteLayersConfig> => {
    const configLayers = config.layers;
    const configSectionLayers = configLayers?.sections;
    const mainColor = config.theme?.mainColor;

    return {
        mainLines: {
            routeLineArrows: {
                ...routeLineArrows,
                beforeID: mapStyleLayerIDs.lowestLabel,
                ...configLayers?.mainLines?.routeLineArrows,
            },
            routeLine: {
                ...routeMainLine({ color: mainColor }),
                beforeID: 'routeLineArrows',
                ...configLayers?.mainLines?.routeLine,
            },
            routeOutline: {
                ...routeOutline,
                beforeID: 'routeLine',
                ...configLayers?.mainLines?.routeOutline,
            },
            routeDeselectedLine: {
                ...routeDeselectedLine,
                beforeID: 'routeOutline',
                ...configLayers?.mainLines?.routeDeselectedLine,
            },
            routeDeselectedOutline: {
                ...routeDeselectedOutline,
                beforeID: 'routeDeselectedLine',
                ...configLayers?.mainLines?.routeDeselectedOutline,
            },
            ...configLayers?.mainLines?.additional,
        },
        waypoints: {
            routeWaypointSymbol: {
                ...waypointSymbols,
                beforeID: 'routeSummaryBubbleSymbol',
                ...configLayers?.waypoints?.routeWaypointSymbol,
            },
            routeWaypointLabel: {
                ...waypointLabels,
                beforeID: 'routeWaypointSymbol',
                ...configLayers?.waypoints?.routeWaypointLabel,
            },
            ...configLayers?.waypoints?.additional,
        },
        chargingStops: {
            routeChargingStopSymbol: {
                ...chargingStopSymbol(config.chargingStops),
                beforeID: 'routeWaypointSymbol',
                ...configLayers?.chargingStops?.routeChargingStopSymbol,
            },
            ...configLayers?.chargingStops?.additional,
        },
        sections: {
            incident: {
                routeIncidentSymbol: {
                    ...routeIncidentsSymbol,
                    beforeID: 'routeChargingStopSymbol',
                    ...configSectionLayers?.incident?.routeIncidentSymbol,
                },
                routeIncidentBackgroundLine: {
                    ...routeIncidentsBGLine,
                    beforeID: mapStyleLayerIDs.lowestLabel,
                    ...configSectionLayers?.incident?.routeIncidentBackgroundLine,
                },
                routeIncidentDashedLine: {
                    ...routeIncidentsDashedLine,
                    beforeID: mapStyleLayerIDs.lowestLabel,
                    ...configSectionLayers?.incident?.routeIncidentDashedLine,
                },
                routeIncidentPatternLine: {
                    ...routeIncidentsPatternLine,
                    beforeID: mapStyleLayerIDs.lowestLabel,
                    ...configSectionLayers?.incident?.routeIncidentPatternLine,
                },
                ...configLayers?.sections?.incident?.additional,
            },
            ferry: {
                routeFerryLine: {
                    ...routeFerriesLine,
                    beforeID: 'routeLineArrows',
                    ...configSectionLayers?.ferry?.routeFerryLine,
                },
                routeFerrySymbol: {
                    ...routeFerriesSymbol,
                    beforeID: 'routeIncidentSymbol',
                    ...configSectionLayers?.ferry?.routeFerrySymbol,
                },
                ...configSectionLayers?.ferry?.additional,
            },
            tollRoad: {
                routeTollRoadOutline: {
                    ...routeTollRoadsOutline,
                    beforeID: 'routeDeselectedOutline',
                    ...configSectionLayers?.tollRoad?.routeTollRoadOutline,
                },
                routeTollRoadSymbol: {
                    ...routeTollRoadsSymbol,
                    beforeID: 'routeChargingStopSymbol',
                    ...configSectionLayers?.tollRoad?.routeTollRoadSymbol,
                },
                ...configSectionLayers?.tollRoad?.additional,
            },
            tunnel: {
                routeTunnelLine: {
                    ...routeTunnelsLine,
                    beforeID: 'routeLineArrows',
                    ...configSectionLayers?.tunnel?.routeTunnelLine,
                },
                ...configSectionLayers?.tunnel?.additional,
            },
            vehicleRestricted: {
                routeVehicleRestrictedBackgroundLine: {
                    ...routeVehicleRestrictedBackgroundLine,
                    beforeID: 'routeVehicleRestrictedForegroundLine',
                    ...configSectionLayers?.vehicleRestricted?.routeVehicleRestrictedBackgroundLine,
                },
                routeVehicleRestrictedForegroundLine: {
                    ...routeVehicleRestrictedDottedLine,
                    beforeID: mapStyleLayerIDs.lowestLabel,
                    ...configSectionLayers?.vehicleRestricted?.routeVehicleRestrictedForegroundLine,
                },
                ...configSectionLayers?.vehicleRestricted?.additional,
            },
        },
        instructionLines: {
            routeInstructionLine: {
                ...instructionLine,
                beforeID: mapStyleLayerIDs.lowestLabel,
                ...configLayers?.instructionLines?.routeInstructionLine,
            },
            routeInstructionOutline: {
                ...instructionOutline,
                beforeID: 'routeInstructionLine',
                ...configLayers?.instructionLines?.routeInstructionOutline,
            },
            ...configLayers?.instructionLines?.additional,
        },
        instructionArrows: {
            routeInstructionArrowSymbol: {
                ...instructionArrow,
                beforeID: 'routeInstructionLine',
                ...configLayers?.instructionArrows?.routeInstructionArrowSymbol,
            },
            ...configLayers?.instructionArrows?.additional,
        },
        summaryBubbles: {
            routeSummaryBubbleSymbol: {
                ...summaryBubbleSymbolPoint,
                ...configLayers?.summaryBubbles?.routeSummaryBubbleSymbol,
            },
            ...configLayers?.summaryBubbles?.additional,
        },
    };
};

/**
 * Default routing layers configuration. Calls routingLayers with no parameters.
 *
 * @remarks
 * This configuration defines the complete visual styling for all route-related map layers,
 * including main route lines, waypoints, special road sections (ferries, tunnels, toll roads, etc.),
 * turn-by-turn guidance instructions, and route summary information.
 *
 * **Usage:**
 * - Automatically applied when initializing {@link RoutingModule} without custom layer configuration
 * - Can be used as a reference or starting point for creating custom layer configurations
 * - Individual properties can be selectively overridden while keeping defaults for others
 *
 * @see {@link buildRoutingLayers} for details.
 *
 * @see {@link RouteLayersConfig} for the configuration type definition
 * @see {@link RoutingModule.get} for initialization options
 * @see {@link RoutingModule.applyConfig} for runtime configuration updates
 *
 * @group Routing
 */
export const defaultRoutingLayers: Required<RouteLayersConfig> = buildRoutingLayers();
