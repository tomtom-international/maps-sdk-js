import { TomTomConfig } from '@anw/maps-sdk-js/core';
import type { LayerSpecsWithOrder, ToBeAddedLayerSpecWithoutSource } from '../../shared';
import type { RouteLayersConfig, RoutingLayersSpecs, RoutingModuleConfig } from '../types/routeModuleConfig';
import { defaultRouteLayersConfig } from '../layers/defaultConfig';

/**
 * @ignore
 */
const mapLayerSpecs = (layerSpecs: LayerSpecsWithOrder = []): ToBeAddedLayerSpecWithoutSource[] =>
    layerSpecs.map(({ layerSpec, id, beforeID }) => ({ ...layerSpec, id, beforeID }));

/**
 * @ignore
 */
export const createLayersSpecs = (config: RouteLayersConfig = {}): RoutingLayersSpecs => ({
    mainLines: mapLayerSpecs(config.mainLines),
    waypoints: mapLayerSpecs(config.waypoints),
    ferries: mapLayerSpecs(config.sections?.ferry),
    evChargingStations: mapLayerSpecs(config.sections?.evChargingStations),
    incidents: mapLayerSpecs(config.sections?.incident),
    tollRoads: mapLayerSpecs(config.sections?.tollRoad),
    tunnels: mapLayerSpecs(config.sections?.tunnel),
    vehicleRestricted: mapLayerSpecs(config.sections?.vehicleRestricted),
    instructionLines: mapLayerSpecs(config.instructionLines),
    instructionArrows: mapLayerSpecs(config.instructionArrows),
    summaryBubbles: mapLayerSpecs(config.summaryBubbles),
});

/**
 * @ignore
 */
export const withDefaults = (config: RoutingModuleConfig | undefined): RoutingModuleConfig => {
    const layers = config?.layers;
    const sections = layers?.sections;
    const defaultSections = defaultRouteLayersConfig.sections;
    const globalDisplayUnits = TomTomConfig.instance.get().displayUnits;
    const displayUnits = config?.displayUnits;
    return {
        ...(config ? config : {}),
        // Global display units are first applied, and can then be overridden by the local configuration:
        ...((globalDisplayUnits || displayUnits) && { ...globalDisplayUnits, ...displayUnits }),
        layers: {
            mainLines: layers?.mainLines ?? defaultRouteLayersConfig.mainLines,
            waypoints: layers?.waypoints ?? defaultRouteLayersConfig.waypoints,
            sections: {
                ferry: sections?.ferry ?? defaultSections?.ferry,
                evChargingStations: sections?.evChargingStations ?? defaultSections?.evChargingStations,
                incident: sections?.incident ?? defaultSections?.incident,
                tollRoad: sections?.tollRoad ?? defaultSections?.tollRoad,
                tunnel: sections?.tunnel ?? defaultSections?.tunnel,
                vehicleRestricted: sections?.vehicleRestricted ?? defaultSections?.vehicleRestricted,
            },
            instructionLines: layers?.instructionLines ?? defaultRouteLayersConfig.instructionLines,
            instructionArrows: layers?.instructionArrows ?? defaultRouteLayersConfig.instructionArrows,
            summaryBubbles: layers?.summaryBubbles ?? defaultRouteLayersConfig.summaryBubbles,
        },
    };
};
