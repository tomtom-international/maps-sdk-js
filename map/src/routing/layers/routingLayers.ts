import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { HasAdditionalLayersConfig, LayerSpecTemplate, ToBeAddedLayerSpecTemplate } from '../../shared';
import { mapStyleLayerIDs } from '../../shared';
import { darkenColor } from '../../utils/colorUtils';
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
import type { SectionLineRole } from './sectionLayers';
import {
    sectionLine,
    sectionLineLayerID,
    sectionSign,
    sectionSignLayerID,
    sectionStyleAnchor,
    sectionSymbol,
    sectionSymbolLayerID,
    withSectionLineKnobs,
    withSectionSymbolKnobs,
} from './sectionLayers';
import type { BespokeSectionType } from './sectionRegistry';
import { generatedSectionTypes, postsSign } from './sectionRegistry';
import { getWaypointIconSize } from './shared';
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

    const sectionConfigs = config.sections;

    // The five bespoke sections keep hand-written layers, but they reach the map the same way the
    // generated ones do: the uniform knobs of their own type first, then the caller's raw spec over
    // them. Naming the type once is what keeps a layer, the configuration it reads and the anchor
    // it lands on from drifting apart. `beforeID` defaults to where the draw style puts the type,
    // which every line but a chained one wants.
    const bespokeSectionLine = (
        type: BespokeSectionType,
        spec: LayerSpecTemplate<LineLayerSpecification>,
        options?: { beforeID?: string; role?: SectionLineRole },
    ): ToBeAddedLayerSpecTemplate<LineLayerSpecification> => ({
        ...withSectionLineKnobs(type, spec, sectionConfigs?.[type], routeWidth, options?.role),
        beforeID: prefixBeforeID(options?.beforeID ?? sectionStyleAnchor(type, sectionConfigs?.[type]), layerIDPrefix),
    });

    const bespokeSectionSymbol = (
        type: BespokeSectionType,
        spec: LayerSpecTemplate<SymbolLayerSpecification>,
        beforeID: string,
    ): ToBeAddedLayerSpecTemplate<SymbolLayerSpecification> => ({
        ...withSectionSymbolKnobs(type, spec, sectionConfigs?.[type]),
        beforeID: prefixBeforeID(beforeID, layerIDPrefix),
    });

    // The generated sections: one registry entry each, rather than a source/layer/config/events
    // quartet per type. Where the line lands follows its draw style, while an icon it asks for
    // goes above everything the route draws either way — an icon under the route line would be an
    // icon nobody sees.
    const generatedSections = Object.fromEntries(
        generatedSectionTypes.map((type) => {
            const sectionConfig = sectionConfigs?.[type];
            const lineLayerID = sectionLineLayerID(type);
            const symbolLayerID = sectionSymbolLayerID(type);
            const advancedConfig = configSectionLayers?.[type] as
                | (Record<string, Partial<ToBeAddedLayerSpecTemplate<LineLayerSpecification>>> &
                      HasAdditionalLayersConfig)
                | undefined;
            // A type that posts a sign draws nothing else: a line along the stretch would mark
            // every one that carries a value without ever saying what the value is. Which icons
            // the sign gives way to is a collision matter the module settles once its layers are
            // on the map, not a `beforeID`.
            if (postsSign(type)) {
                const signLayerID = sectionSignLayerID(type);
                return [
                    type,
                    {
                        [signLayerID]: mergeLayer(sectionSign(type, sectionConfig), advancedConfig?.[signLayerID]),
                        ...prefixBeforeIDs(advancedConfig?.additional, layerIDPrefix),
                    },
                ];
            }

            const symbolLayer = sectionConfig && sectionSymbol(type, sectionConfig);
            return [
                type,
                {
                    [lineLayerID]: mergeLayer(
                        {
                            ...sectionLine(type, sectionConfig, routeWidth),
                            beforeID: prefixBeforeID(sectionStyleAnchor(type, sectionConfig), layerIDPrefix),
                        },
                        advancedConfig?.[lineLayerID],
                    ),
                    ...(symbolLayer && {
                        [symbolLayerID]: mergeLayer(
                            { ...symbolLayer, beforeID: mapStyleLayerIDs.lowestLabel },
                            advancedConfig?.[symbolLayerID],
                        ),
                    }),
                    ...prefixBeforeIDs(advancedConfig?.additional, layerIDPrefix),
                },
            ];
        }),
    );

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
            ...generatedSections,
            traffic: {
                routeIncidentJamSymbol: mergeLayer(
                    bespokeSectionSymbol('traffic', routeIncidentsJamSymbol, 'routeChargingStopSymbol'),
                    configSectionLayers?.traffic?.routeIncidentJamSymbol,
                ),
                routeIncidentCauseSymbol: mergeLayer(
                    bespokeSectionSymbol('traffic', routeIncidentsCauseSymbol, 'routeChargingStopSymbol'),
                    configSectionLayers?.traffic?.routeIncidentCauseSymbol,
                ),
                routeIncidentBackgroundLine: mergeLayer(
                    bespokeSectionLine('traffic', routeIncidentsBGLine, { beforeID: 'routeIncidentDashedLine' }),
                    configSectionLayers?.traffic?.routeIncidentBackgroundLine,
                ),
                routeIncidentDashedLine: mergeLayer(
                    bespokeSectionLine('traffic', routeIncidentsDashedLine),
                    configSectionLayers?.traffic?.routeIncidentDashedLine,
                ),
                ...prefixBeforeIDs(configSectionLayers?.traffic?.additional, layerIDPrefix),
            },
            ferry: {
                routeFerryLine: mergeLayer(
                    bespokeSectionLine('ferry', routeFerriesLine),
                    configSectionLayers?.ferry?.routeFerryLine,
                ),
                routeFerrySymbol: mergeLayer(
                    bespokeSectionSymbol('ferry', routeFerriesSymbol, 'routeIncidentJamSymbol'),
                    configSectionLayers?.ferry?.routeFerrySymbol,
                ),
                ...prefixBeforeIDs(configSectionLayers?.ferry?.additional, layerIDPrefix),
            },
            tollRoad: {
                routeTollRoadOutline: mergeLayer(
                    bespokeSectionLine('tollRoad', routeTollRoadsOutline),
                    configSectionLayers?.tollRoad?.routeTollRoadOutline,
                ),
                routeTollRoadSymbol: mergeLayer(
                    bespokeSectionSymbol('tollRoad', routeTollRoadsSymbol, 'routeChargingStopSymbol'),
                    configSectionLayers?.tollRoad?.routeTollRoadSymbol,
                ),
                ...prefixBeforeIDs(configSectionLayers?.tollRoad?.additional, layerIDPrefix),
            },
            tunnel: {
                routeTunnelLine: mergeLayer(
                    bespokeSectionLine('tunnel', routeTunnelsLine),
                    configSectionLayers?.tunnel?.routeTunnelLine,
                ),
                ...prefixBeforeIDs(configSectionLayers?.tunnel?.additional, layerIDPrefix),
            },
            vehicleRestricted: {
                // The background is the continuous halo the dots sit on, so it chains to the line
                // above it rather than to the route, and derives its colour as an outline.
                routeVehicleRestrictedBackgroundLine: mergeLayer(
                    bespokeSectionLine('vehicleRestricted', routeVehicleRestrictedBackgroundLine, {
                        beforeID: 'routeVehicleRestrictedForegroundLine',
                        role: 'outline',
                    }),
                    configSectionLayers?.vehicleRestricted?.routeVehicleRestrictedBackgroundLine,
                ),
                routeVehicleRestrictedForegroundLine: mergeLayer(
                    bespokeSectionLine('vehicleRestricted', routeVehicleRestrictedDottedLine),
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
