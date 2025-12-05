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
    routeIncidentsCauseSymbol,
    routeIncidentsDashedLine,
    routeIncidentsJamSymbol,
} from './routeTrafficSectionLayers';
import { routeTunnelsLine } from './routeTunnelSectionLayers';
import { routeVehicleRestrictedBackgroundLine, routeVehicleRestrictedDottedLine } from './routeVehicleRestrictedLayers';
import { buildSummaryBubbleSymbolPoint, summaryBubbleSymbolPoint } from './summaryBubbleLayers';
import { waypointLabels, waypointSymbols } from './waypointLayers';

/**
 * Helper function to add layer ID prefix to beforeID references, but only for internal routing layer IDs
 * @ignore
 */
const prefixBeforeID = (beforeID: string | undefined, layerIDPrefix: string | undefined): string | undefined => {
    if (!beforeID || !layerIDPrefix) {
        return beforeID;
    }
    // Don't prefix map style layer IDs (they start with capital letters or contain specific prefixes)
    if (beforeID.startsWith('route') || beforeID.startsWith('waypoint')) {
        return `${layerIDPrefix}-${beforeID}`;
    }
    return beforeID;
};

/**
 * Helper function to add instance suffix to image IDs for supporting multiple RoutingModule instances
 * @ignore
 */
const suffixImageID = (imageID: string | undefined, instanceIndex: number | undefined): string | undefined => {
    if (!imageID || instanceIndex === undefined) {
        return imageID;
    }
    return `${imageID}-${instanceIndex}`;
};

/**
 * Generates the routing layers configuration for route visualization on the map.
 * @param config - Optional routing module configuration to customize layer properties.
 * @param layerIDPrefix - Optional prefix to add to layer IDs for supporting multiple instances.
 * @param instanceIndex - Optional instance index for image ID suffixes.
 * @ignore
 */
export const buildRoutingLayers = (
    config: RoutingModuleConfig = {},
    layerIDPrefix?: string,
    instanceIndex?: number,
): Required<RouteLayersConfig> => {
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
                beforeID: prefixBeforeID('routeIncidentBackgroundLine', layerIDPrefix),
                ...configLayers?.mainLines?.routeLine,
            },
            routeOutline: {
                ...routeOutline,
                beforeID: prefixBeforeID('routeLine', layerIDPrefix),
                ...configLayers?.mainLines?.routeOutline,
            },
            routeDeselectedLine: {
                ...routeDeselectedLine,
                beforeID: prefixBeforeID('routeOutline', layerIDPrefix),
                ...configLayers?.mainLines?.routeDeselectedLine,
            },
            routeDeselectedOutline: {
                ...routeDeselectedOutline,
                beforeID: prefixBeforeID('routeDeselectedLine', layerIDPrefix),
                ...configLayers?.mainLines?.routeDeselectedOutline,
            },
            ...configLayers?.mainLines?.additional,
        },
        waypoints: {
            routeWaypointSymbol: {
                ...waypointSymbols,
                beforeID: prefixBeforeID('routeSummaryBubbleSymbol', layerIDPrefix),
                ...configLayers?.waypoints?.routeWaypointSymbol,
            },
            routeWaypointLabel: {
                ...waypointLabels,
                beforeID: prefixBeforeID('routeWaypointSymbol', layerIDPrefix),
                ...configLayers?.waypoints?.routeWaypointLabel,
            },
            ...configLayers?.waypoints?.additional,
        },
        chargingStops: {
            routeChargingStopSymbol: {
                ...chargingStopSymbol(config.chargingStops),
                beforeID: prefixBeforeID('routeWaypointSymbol', layerIDPrefix),
                ...configLayers?.chargingStops?.routeChargingStopSymbol,
            },
            ...configLayers?.chargingStops?.additional,
        },
        sections: {
            incident: {
                routeIncidentJamSymbol: {
                    ...routeIncidentsJamSymbol,
                    beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    ...configSectionLayers?.incident?.routeIncidentJamSymbol,
                },
                routeIncidentCauseSymbol: {
                    ...routeIncidentsCauseSymbol,
                    beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    ...configSectionLayers?.incident?.routeIncidentCauseSymbol,
                },
                routeIncidentBackgroundLine: {
                    ...routeIncidentsBGLine,
                    beforeID: prefixBeforeID('routeIncidentDashedLine', layerIDPrefix),
                    ...configSectionLayers?.incident?.routeIncidentBackgroundLine,
                },
                routeIncidentDashedLine: {
                    ...routeIncidentsDashedLine,
                    beforeID: prefixBeforeID('routeTunnelLine', layerIDPrefix),
                    ...configSectionLayers?.incident?.routeIncidentDashedLine,
                },
            },
            ferry: {
                routeFerryLine: {
                    ...routeFerriesLine,
                    beforeID: prefixBeforeID('routeLineArrows', layerIDPrefix),
                    ...configSectionLayers?.ferry?.routeFerryLine,
                },
                routeFerrySymbol: {
                    ...routeFerriesSymbol,
                    beforeID: prefixBeforeID('routeIncidentJamSymbol', layerIDPrefix),
                    ...configSectionLayers?.ferry?.routeFerrySymbol,
                },
                ...configSectionLayers?.ferry?.additional,
            },
            tollRoad: {
                routeTollRoadOutline: {
                    ...routeTollRoadsOutline,
                    beforeID: prefixBeforeID('routeDeselectedOutline', layerIDPrefix),
                    ...configSectionLayers?.tollRoad?.routeTollRoadOutline,
                },
                routeTollRoadSymbol: {
                    ...routeTollRoadsSymbol,
                    beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    ...configSectionLayers?.tollRoad?.routeTollRoadSymbol,
                },
                ...configSectionLayers?.tollRoad?.additional,
            },
            tunnel: {
                routeTunnelLine: {
                    ...routeTunnelsLine,
                    beforeID: prefixBeforeID('routeLineArrows', layerIDPrefix),
                    ...configSectionLayers?.tunnel?.routeTunnelLine,
                },
                ...configSectionLayers?.tunnel?.additional,
            },
            vehicleRestricted: {
                routeVehicleRestrictedBackgroundLine: {
                    ...routeVehicleRestrictedBackgroundLine,
                    beforeID: prefixBeforeID('routeVehicleRestrictedForegroundLine', layerIDPrefix),
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
                beforeID: prefixBeforeID('routeInstructionLine', layerIDPrefix),
                ...configLayers?.instructionLines?.routeInstructionOutline,
            },
            ...configLayers?.instructionLines?.additional,
        },
        instructionArrows: {
            routeInstructionArrowSymbol: {
                ...instructionArrow,
                beforeID: prefixBeforeID('routeInstructionLine', layerIDPrefix),
                ...(instanceIndex !== undefined && {
                    layout: {
                        ...instructionArrow.layout,
                        'icon-image': suffixImageID(instructionArrow.layout?.['icon-image'] as string, instanceIndex),
                    },
                }),
                ...configLayers?.instructionArrows?.routeInstructionArrowSymbol,
            },
            ...configLayers?.instructionArrows?.additional,
        },
        summaryBubbles: {
            routeSummaryBubbleSymbol: {
                ...(instanceIndex !== undefined
                    ? buildSummaryBubbleSymbolPoint(instanceIndex)
                    : summaryBubbleSymbolPoint),
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
