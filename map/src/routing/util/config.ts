import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { ToBeAddedLayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { buildRoutingLayers } from '../layers/routingLayers';
import type { RouteLayersConfig, RoutingModuleConfig } from '../types/routeModuleConfig';
import type { RoutingLayersSpecs } from '../types/routingSourcesAndLayers';

/**
 * @ignore
 */
const mapLayerSpecs = (
    layerSpecs: Record<string, Partial<ToBeAddedLayerSpecTemplate>> = {},
    layerIDPrefix?: string,
): ToBeAddedLayerSpecWithoutSource[] =>
    // The key of the entry is the layer ID:
    Object.entries(layerSpecs).map(
        ([id, spec]) =>
            ({
                ...spec,
                id: layerIDPrefix ? `${layerIDPrefix}-${id}` : id,
            }) as ToBeAddedLayerSpecWithoutSource,
    );

/**
 * @ignore
 */
export const createLayersSpecs = (
    layerConfigs: RouteLayersConfig = {},
    layerIDPrefix?: string,
): RoutingLayersSpecs => ({
    mainLines: mapLayerSpecs(layerConfigs.mainLines, layerIDPrefix),
    waypoints: mapLayerSpecs(layerConfigs.waypoints, layerIDPrefix),
    chargingStops: mapLayerSpecs(layerConfigs?.chargingStops, layerIDPrefix),
    ferries: mapLayerSpecs(layerConfigs.sections?.ferry, layerIDPrefix),
    incidents: mapLayerSpecs(layerConfigs.sections?.incident, layerIDPrefix),
    tollRoads: mapLayerSpecs(layerConfigs.sections?.tollRoad, layerIDPrefix),
    tunnels: mapLayerSpecs(layerConfigs.sections?.tunnel, layerIDPrefix),
    vehicleRestricted: mapLayerSpecs(layerConfigs.sections?.vehicleRestricted, layerIDPrefix),
    instructionLines: mapLayerSpecs(layerConfigs.instructionLines, layerIDPrefix),
    instructionArrows: mapLayerSpecs(layerConfigs.instructionArrows, layerIDPrefix),
    summaryBubbles: mapLayerSpecs(layerConfigs.summaryBubbles, layerIDPrefix),
});

/**
 * @ignore
 */
export const routeModuleConfigWithDefaults = (
    config: RoutingModuleConfig | undefined,
    layerIDPrefix: string,
    instanceIndex: number,
): RoutingModuleConfig => {
    const globalDisplayUnits = TomTomConfig.instance.get().displayUnits;
    const displayUnits = config?.displayUnits;
    return {
        // First apply the provided configuration not to lose any properties:
        ...config,
        ...(displayUnits ? {} : { displayUnits: globalDisplayUnits }),
        layers: buildRoutingLayers(config, layerIDPrefix, instanceIndex),
    };
};
