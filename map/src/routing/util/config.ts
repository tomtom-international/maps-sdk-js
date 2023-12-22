import { LayersSpecWithOrder, ToBeAddedLayerSpecWithoutSource } from "../../shared";
import { RouteLayersConfig, RoutingLayersSpecs, RoutingModuleConfig } from "../types/routeModuleConfig";
import { defaultRouteLayersConfig } from "../layers/defaultConfig";

/**
 * @ignore
 */
const mapLayerSpecs = (layerSpecs: LayersSpecWithOrder = { layers: [] }): ToBeAddedLayerSpecWithoutSource[] =>
    layerSpecs.layers.map(
        ({ layerSpec, id, beforeID }) => ({ ...layerSpec, id, beforeID } as ToBeAddedLayerSpecWithoutSource)
    );

/**
 * @ignore
 */
export const createLayersSpecs = (config: RouteLayersConfig = {}): RoutingLayersSpecs => ({
    routeLines: mapLayerSpecs(config.mainLine),
    waypoints: mapLayerSpecs(config.waypoints),
    ferries: mapLayerSpecs(config.sections?.ferry),
    evChargingStations: mapLayerSpecs(config.sections?.evChargingStations),
    incidents: mapLayerSpecs(config.sections?.incident),
    tollRoads: mapLayerSpecs(config.sections?.tollRoad),
    tunnels: mapLayerSpecs(config.sections?.tunnel),
    vehicleRestricted: mapLayerSpecs(config.sections?.vehicleRestricted),
    instructionLines: mapLayerSpecs(config.instructionLines),
    instructionArrows: mapLayerSpecs(config.instructionArrows)
});

/**
 * @ignore
 */
export const mergeConfig = (config: RoutingModuleConfig | undefined): RoutingModuleConfig => ({
    ...(config ? config : {}),
    routeLayers: {
        mainLine: config?.routeLayers?.mainLine ?? defaultRouteLayersConfig.mainLine,
        waypoints: config?.routeLayers?.waypoints ?? defaultRouteLayersConfig.waypoints,
        sections: {
            ferry: config?.routeLayers?.sections?.ferry ?? defaultRouteLayersConfig.sections?.ferry,
            evChargingStations:
                config?.routeLayers?.sections?.evChargingStations ??
                defaultRouteLayersConfig.sections?.evChargingStations,
            incident: config?.routeLayers?.sections?.incident ?? defaultRouteLayersConfig.sections?.incident,
            tollRoad: config?.routeLayers?.sections?.tollRoad ?? defaultRouteLayersConfig.sections?.tollRoad,
            tunnel: config?.routeLayers?.sections?.tunnel ?? defaultRouteLayersConfig.sections?.tunnel,
            vehicleRestricted:
                config?.routeLayers?.sections?.vehicleRestricted ?? defaultRouteLayersConfig.sections?.vehicleRestricted
        },
        instructionLines: config?.routeLayers?.instructionLines ?? defaultRouteLayersConfig.instructionLines,
        instructionArrows: config?.routeLayers?.instructionArrows ?? defaultRouteLayersConfig.instructionArrows
    }
});
