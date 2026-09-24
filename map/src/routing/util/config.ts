import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import type { LightDark, ToBeAddedLayerSpecTemplate, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import { prefixLayerID } from '../../shared/layers/utils';
import { buildRoutingLayers } from '../layers/routingLayers';
import {
    type GeneratedSectionType,
    generatedSectionTypes,
    type SectionSourceKey,
    sectionSourceKey,
} from '../layers/sectionRegistry';
import type { RouteLayersConfig, RoutingModuleConfig } from '../types/routeModuleConfig';
import type { RoutingLayersSpecs } from '../types/routingSourcesAndLayers';

/**
 * @ignore
 */
const mapLayerSpecs = (
    layerSpecs: Record<string, Partial<ToBeAddedLayerSpecTemplate>> = {},
    layerIDPrefix?: string,
): ToBeAddedLayerSpecWithoutSource[] =>
    // The key of the entry is the layer ID. A configured spec is a patch to merge into a built
    // layer, so it carries no `type` of its own and only the assertion makes it stand in for a
    // whole one:
    Object.entries(layerSpecs).map(
        ([id, spec]) =>
            ({
                ...spec,
                id: prefixLayerID(id, layerIDPrefix),
            }) as ToBeAddedLayerSpecWithoutSource, // NOSONAR
    );

/**
 * @ignore
 */
export const createLayersSpecs = (
    layerConfigs: RouteLayersConfig = {},
    layerIDPrefix?: string,
): RoutingLayersSpecs => ({
    ...(Object.fromEntries(
        generatedSectionTypes.map((type) => [
            sectionSourceKey(type),
            mapLayerSpecs(layerConfigs.sections?.[type], layerIDPrefix),
        ]),
    ) as Pick<RoutingLayersSpecs, SectionSourceKey<GeneratedSectionType>>),
    mainLines: mapLayerSpecs(layerConfigs.mainLines, layerIDPrefix),
    waypoints: mapLayerSpecs(layerConfigs.waypoints, layerIDPrefix),
    chargingStops: mapLayerSpecs(layerConfigs?.chargingStops, layerIDPrefix),
    ferries: mapLayerSpecs(layerConfigs.sections?.ferry, layerIDPrefix),
    incidents: mapLayerSpecs(layerConfigs.sections?.traffic, layerIDPrefix),
    tollRoads: mapLayerSpecs(layerConfigs.sections?.tollRoad, layerIDPrefix),
    tunnels: mapLayerSpecs(layerConfigs.sections?.tunnel, layerIDPrefix),
    vehicleRestricted: mapLayerSpecs(layerConfigs.sections?.vehicleRestricted, layerIDPrefix),
    instructionLines: mapLayerSpecs(layerConfigs.instructionLines, layerIDPrefix),
    instructionArrows: mapLayerSpecs(layerConfigs.instructionArrows, layerIDPrefix),
    summaryBubbles: mapLayerSpecs(layerConfigs.summaryBubbles, layerIDPrefix),
    countryCrossings: mapLayerSpecs(layerConfigs.countryCrossings, layerIDPrefix),
});

/**
 * @ignore
 */
export const routeModuleConfigWithDefaults = (
    config: RoutingModuleConfig | undefined,
    layerIDPrefix: string,
    instanceIndex: number,
    lightDark?: LightDark,
): RoutingModuleConfig => {
    const globalDisplayUnits = TomTomConfig.instance.get().displayUnits;
    const displayUnits = config?.displayUnits;
    return {
        // First apply the provided configuration not to lose any properties:
        ...config,
        ...(displayUnits ? {} : { displayUnits: globalDisplayUnits }),
        layers: buildRoutingLayers(config, layerIDPrefix, instanceIndex, lightDark),
    };
};
