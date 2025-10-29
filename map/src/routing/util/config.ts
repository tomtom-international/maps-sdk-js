import { TomTomConfig } from '@cet/maps-sdk-js/core';
import type { ToBeAddedLayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { buildRoutingLayers } from '../layers/routingLayers';
import type { RouteLayersConfig, RoutingModuleConfig } from '../types/routeModuleConfig';
import type { RoutingLayersSpecs } from '../types/routingSourcesAndLayers';

/**
 * @ignore
 */
const mapLayerSpecs = (
    layerSpecs: Record<string, Partial<ToBeAddedLayerSpecTemplate>> = {},
): ToBeAddedLayerSpecWithoutSource[] =>
    // The key of the entry is the layer ID:
    Object.entries(layerSpecs).map(([id, spec]) => ({ ...spec, id }) as ToBeAddedLayerSpecWithoutSource);

/**
 * @ignore
 */
export const createLayersSpecs = (layerConfigs: RouteLayersConfig = {}): RoutingLayersSpecs => ({
    mainLines: mapLayerSpecs(layerConfigs.mainLines),
    waypoints: mapLayerSpecs(layerConfigs.waypoints),
    chargingStops: mapLayerSpecs(layerConfigs?.chargingStops),
    ferries: mapLayerSpecs(layerConfigs.sections?.ferry),
    incidents: mapLayerSpecs(layerConfigs.sections?.incident),
    tollRoads: mapLayerSpecs(layerConfigs.sections?.tollRoad),
    tunnels: mapLayerSpecs(layerConfigs.sections?.tunnel),
    vehicleRestricted: mapLayerSpecs(layerConfigs.sections?.vehicleRestricted),
    instructionLines: mapLayerSpecs(layerConfigs.instructionLines),
    instructionArrows: mapLayerSpecs(layerConfigs.instructionArrows),
    summaryBubbles: mapLayerSpecs(layerConfigs.summaryBubbles),
});

/**
 * @ignore
 */
export const routeModuleConfigWithDefaults = (config: RoutingModuleConfig | undefined): RoutingModuleConfig => {
    const globalDisplayUnits = TomTomConfig.instance.get().displayUnits;
    const displayUnits = config?.displayUnits;
    return {
        // First apply the provided configuration not to lose any properties:
        ...config,
        ...(displayUnits ? {} : { displayUnits: globalDisplayUnits }),
        layers: buildRoutingLayers(config),
    };
};
