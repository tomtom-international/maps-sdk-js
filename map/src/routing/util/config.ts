import { LayersSpecWithOrder, ToBeAddedLayerSpecWithoutSource } from "../../shared";
import { RouteLayersConfig, RoutingLayersSpecs, RoutingModuleConfig } from "../types/routeModuleConfig";
import { defaultRouteLayersConfig } from "../layers/defaultConfig";

/**
 * @ignore
 */
const mapLayerSpecs = (layerSpecs: LayersSpecWithOrder = { layers: [] }): ToBeAddedLayerSpecWithoutSource[] =>
    layerSpecs.layers.map(({ layerSpec, id, beforeID }) => ({ ...layerSpec, id, beforeID }));

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
    summaryBubbles: mapLayerSpecs(config.summaryBubbles)
});

/**
 * @ignore
 */
export const withDefaults = (config: RoutingModuleConfig | undefined): RoutingModuleConfig => {
    const layers = config?.routeLayers;
    const sections = layers?.sections;
    const defaultSections = defaultRouteLayersConfig.sections;
    return {
        ...(config ? config : {}),
        distanceUnits: config?.distanceUnits ?? "metric",
        routeLayers: {
            mainLines: layers?.mainLines ?? defaultRouteLayersConfig.mainLines,
            waypoints: layers?.waypoints ?? defaultRouteLayersConfig.waypoints,
            sections: {
                ferry: sections?.ferry ?? defaultSections?.ferry,
                evChargingStations: sections?.evChargingStations ?? defaultSections?.evChargingStations,
                incident: sections?.incident ?? defaultSections?.incident,
                tollRoad: sections?.tollRoad ?? defaultSections?.tollRoad,
                tunnel: sections?.tunnel ?? defaultSections?.tunnel,
                vehicleRestricted: sections?.vehicleRestricted ?? defaultSections?.vehicleRestricted
            },
            instructionLines: layers?.instructionLines ?? defaultRouteLayersConfig.instructionLines,
            instructionArrows: layers?.instructionArrows ?? defaultRouteLayersConfig.instructionArrows,
            summaryBubbles: layers?.summaryBubbles ?? defaultRouteLayersConfig.summaryBubbles
        }
    };
};
