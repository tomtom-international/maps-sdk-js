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
import { darkenColor, getWaypointIconSize } from './shared';
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
 * Helper function to process additional layers and prefix their beforeID fields
 * @ignore
 */
const prefixBeforeIDs = (
    additional: Record<string, any> | undefined,
    layerIDPrefix: string | undefined,
): Record<string, any> | undefined => {
    if (!additional || !layerIDPrefix) {
        return additional;
    }

    return Object.fromEntries(
        Object.entries(additional).map(([key, layer]) => [
            key,
            layer?.beforeID ? { ...layer, beforeID: prefixBeforeID(layer.beforeID, layerIDPrefix) } : layer,
        ]),
    );
};

/**
 * Merges a base layer spec with a user override, deep-merging paint and layout instead of replacing them.
 * @ignore
 */
const mergeLayer = <T extends Record<string, any>>(base: T, override: Record<string, any> | undefined): T => {
    if (!override) return base;
    return {
        ...base,
        ...override,
        ...(override.paint && { paint: { ...base.paint, ...override.paint } }),
        ...(override.layout && { layout: { ...base.layout, ...override.layout } }),
    };
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
    const routeColor = config.theme?.mainColor;
    const outlineColor = routeColor ? darkenColor(routeColor, 0.4) : undefined;
    const routeWidth = config.theme?.routeWidth;
    const waypointSize = config.theme?.waypointSize;
    const waypointIconSize = getWaypointIconSize(waypointSize);

    return {
        mainLines: {
            routeLineArrows: mergeLayer(
                { ...routeLineArrows, beforeID: mapStyleLayerIDs.lowestLabel },
                configLayers?.mainLines?.routeLineArrows,
            ),
            routeLine: mergeLayer(
                {
                    ...routeMainLine(routeWidth, routeColor),
                    beforeID: prefixBeforeID('routeIncidentBackgroundLine', layerIDPrefix),
                },
                configLayers?.mainLines?.routeLine,
            ),
            routeOutline: mergeLayer(
                { ...routeOutline(routeWidth, outlineColor), beforeID: prefixBeforeID('routeLine', layerIDPrefix) },
                configLayers?.mainLines?.routeOutline,
            ),
            routeDeselectedLine: mergeLayer(
                { ...routeDeselectedLine(routeWidth), beforeID: prefixBeforeID('routeOutline', layerIDPrefix) },
                configLayers?.mainLines?.routeDeselectedLine,
            ),
            routeDeselectedOutline: mergeLayer(
                {
                    ...routeDeselectedOutline(routeWidth),
                    beforeID: prefixBeforeID('routeDeselectedLine', layerIDPrefix),
                },
                configLayers?.mainLines?.routeDeselectedOutline,
            ),
            ...prefixBeforeIDs(configLayers?.mainLines?.additional, layerIDPrefix),
        },
        waypoints: {
            routeWaypointSymbol: mergeLayer(
                {
                    ...waypointSymbols,
                    layout: { ...waypointSymbols.layout, 'icon-size': waypointIconSize },
                    beforeID: prefixBeforeID('routeSummaryBubbleSymbol', layerIDPrefix),
                },
                configLayers?.waypoints?.routeWaypointSymbol,
            ),
            routeWaypointLabel: mergeLayer(
                { ...waypointLabels, beforeID: prefixBeforeID('routeWaypointSymbol', layerIDPrefix) },
                configLayers?.waypoints?.routeWaypointLabel,
            ),
            ...prefixBeforeIDs(configLayers?.waypoints?.additional, layerIDPrefix),
        },
        chargingStops: {
            routeChargingStopSymbol: mergeLayer(
                {
                    ...chargingStopSymbol(config.chargingStops),
                    beforeID: prefixBeforeID('routeWaypointSymbol', layerIDPrefix),
                },
                configLayers?.chargingStops?.routeChargingStopSymbol,
            ),
            ...prefixBeforeIDs(configLayers?.chargingStops?.additional, layerIDPrefix),
        },
        sections: {
            incident: {
                routeIncidentJamSymbol: mergeLayer(
                    {
                        ...routeIncidentsJamSymbol,
                        beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    },
                    configSectionLayers?.incident?.routeIncidentJamSymbol,
                ),
                routeIncidentCauseSymbol: mergeLayer(
                    {
                        ...routeIncidentsCauseSymbol,
                        beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    },
                    configSectionLayers?.incident?.routeIncidentCauseSymbol,
                ),
                routeIncidentBackgroundLine: mergeLayer(
                    {
                        ...routeIncidentsBGLine(routeWidth),
                        beforeID: prefixBeforeID('routeIncidentDashedLine', layerIDPrefix),
                    },
                    configSectionLayers?.incident?.routeIncidentBackgroundLine,
                ),
                routeIncidentDashedLine: mergeLayer(
                    {
                        ...routeIncidentsDashedLine(routeWidth),
                        beforeID: prefixBeforeID('routeTunnelLine', layerIDPrefix),
                    },
                    configSectionLayers?.incident?.routeIncidentDashedLine,
                ),
                ...prefixBeforeIDs(configSectionLayers?.incident?.additional, layerIDPrefix),
            },
            ferry: {
                routeFerryLine: mergeLayer(
                    { ...routeFerriesLine(routeWidth), beforeID: prefixBeforeID('routeLineArrows', layerIDPrefix) },
                    configSectionLayers?.ferry?.routeFerryLine,
                ),
                routeFerrySymbol: mergeLayer(
                    {
                        ...routeFerriesSymbol,
                        beforeID: prefixBeforeID('routeIncidentJamSymbol', layerIDPrefix),
                    },
                    configSectionLayers?.ferry?.routeFerrySymbol,
                ),
                ...prefixBeforeIDs(configSectionLayers?.ferry?.additional, layerIDPrefix),
            },
            tollRoad: {
                routeTollRoadOutline: mergeLayer(
                    {
                        ...routeTollRoadsOutline(routeWidth),
                        beforeID: prefixBeforeID('routeDeselectedOutline', layerIDPrefix),
                    },
                    configSectionLayers?.tollRoad?.routeTollRoadOutline,
                ),
                routeTollRoadSymbol: mergeLayer(
                    {
                        ...routeTollRoadsSymbol,
                        beforeID: prefixBeforeID('routeChargingStopSymbol', layerIDPrefix),
                    },
                    configSectionLayers?.tollRoad?.routeTollRoadSymbol,
                ),
                ...prefixBeforeIDs(configSectionLayers?.tollRoad?.additional, layerIDPrefix),
            },
            tunnel: {
                routeTunnelLine: mergeLayer(
                    { ...routeTunnelsLine(routeWidth), beforeID: prefixBeforeID('routeLineArrows', layerIDPrefix) },
                    configSectionLayers?.tunnel?.routeTunnelLine,
                ),
                ...prefixBeforeIDs(configSectionLayers?.tunnel?.additional, layerIDPrefix),
            },
            vehicleRestricted: {
                routeVehicleRestrictedBackgroundLine: mergeLayer(
                    {
                        ...routeVehicleRestrictedBackgroundLine(routeWidth),
                        beforeID: prefixBeforeID('routeVehicleRestrictedForegroundLine', layerIDPrefix),
                    },
                    configSectionLayers?.vehicleRestricted?.routeVehicleRestrictedBackgroundLine,
                ),
                routeVehicleRestrictedForegroundLine: mergeLayer(
                    { ...routeVehicleRestrictedDottedLine(routeWidth), beforeID: mapStyleLayerIDs.lowestLabel },
                    configSectionLayers?.vehicleRestricted?.routeVehicleRestrictedForegroundLine,
                ),
                ...prefixBeforeIDs(configSectionLayers?.vehicleRestricted?.additional, layerIDPrefix),
            },
        },
        instructionLines: {
            routeInstructionLine: mergeLayer(
                { ...instructionLine(routeWidth), beforeID: mapStyleLayerIDs.lowestLabel },
                configLayers?.instructionLines?.routeInstructionLine,
            ),
            routeInstructionOutline: mergeLayer(
                {
                    ...instructionOutline(routeWidth),
                    beforeID: prefixBeforeID('routeInstructionLine', layerIDPrefix),
                },
                configLayers?.instructionLines?.routeInstructionOutline,
            ),
            ...prefixBeforeIDs(configLayers?.instructionLines?.additional, layerIDPrefix),
        },
        instructionArrows: {
            routeInstructionArrowSymbol: mergeLayer(
                {
                    ...instructionArrow,
                    beforeID: prefixBeforeID('routeInstructionLine', layerIDPrefix),
                    ...(instanceIndex !== undefined && {
                        layout: {
                            ...instructionArrow.layout,
                            'icon-image': suffixImageID(
                                instructionArrow.layout?.['icon-image'] as string,
                                instanceIndex,
                            ),
                        },
                    }),
                },
                configLayers?.instructionArrows?.routeInstructionArrowSymbol,
            ),
            ...prefixBeforeIDs(configLayers?.instructionArrows?.additional, layerIDPrefix),
        },
        summaryBubbles: {
            routeSummaryBubbleSymbol: mergeLayer(
                instanceIndex === undefined ? summaryBubbleSymbolPoint : buildSummaryBubbleSymbolPoint(instanceIndex),
                configLayers?.summaryBubbles?.routeSummaryBubbleSymbol,
            ),
            ...prefixBeforeIDs(configLayers?.summaryBubbles?.additional, layerIDPrefix),
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
