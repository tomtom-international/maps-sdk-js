import { Routes } from "@anw/maps-sdk-js/core";
import { DisplayRouteProps } from "../types/displayRoutes";
import { LayersSpecWithOrder, ToBeAddedLayerSpecWithoutSource } from "../../shared";
import { DEFAULT_ROUTE_LAYERS_CONFIGURATION, RouteLayersConfig, RoutingModuleConfig } from "../types/routeModuleConfig";

/**
 * Builds map display-ready routes, applying default style props.
 * @ignore
 */
export const buildDisplayRoutes = (routes: Routes, selectedIndex = 0): Routes<DisplayRouteProps> => ({
    ...routes,
    features: routes.features.map((route, index) => ({
        ...route,
        properties: {
            ...route.properties,
            routeStyle: index === selectedIndex ? "selected" : "deselected"
        }
    }))
});

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
export type RoutingLayersSpecs = {
    waypoints: ToBeAddedLayerSpecWithoutSource[];
    routeLines: ToBeAddedLayerSpecWithoutSource[];
    // route sections:
    vehicleRestricted: ToBeAddedLayerSpecWithoutSource[];
    incidents: ToBeAddedLayerSpecWithoutSource[];
    ferries: ToBeAddedLayerSpecWithoutSource[];
    ev_charging_stations: ToBeAddedLayerSpecWithoutSource[];
    tollRoads: ToBeAddedLayerSpecWithoutSource[];
    tunnels: ToBeAddedLayerSpecWithoutSource[];
};

/**
 * @ignore
 */
export const createLayersSpecs = ({ mainLine, waypoint, sections }: RouteLayersConfig = {}): RoutingLayersSpecs => ({
    routeLines: mapLayerSpecs(mainLine),
    waypoints: mapLayerSpecs(waypoint),
    ferries: mapLayerSpecs(sections?.ferry),
    ev_charging_stations: mapLayerSpecs(sections?.ev_charging_stations),
    incidents: mapLayerSpecs(sections?.incident),
    tollRoads: mapLayerSpecs(sections?.tollRoad),
    tunnels: mapLayerSpecs(sections?.tunnel),
    vehicleRestricted: mapLayerSpecs(sections?.vehicleRestricted)
});

/**
 * @ignore
 */
export const mergeConfig = (config: RoutingModuleConfig | undefined): RoutingModuleConfig => ({
    ...(config ? config : {}),
    routeLayers: {
        mainLine: config?.routeLayers?.mainLine ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.mainLine,
        waypoint: config?.routeLayers?.waypoint ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.waypoint,
        sections: {
            ferry: config?.routeLayers?.sections?.ferry ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.ferry,
            ev_charging_stations:
                config?.routeLayers?.sections?.ev_charging_stations ??
                DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.ev_charging_stations,
            incident: config?.routeLayers?.sections?.incident ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.incident,
            tollRoad: config?.routeLayers?.sections?.tollRoad ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.tollRoad,
            tunnel: config?.routeLayers?.sections?.tunnel ?? DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.tunnel,
            vehicleRestricted:
                config?.routeLayers?.sections?.vehicleRestricted ??
                DEFAULT_ROUTE_LAYERS_CONFIGURATION.sections?.vehicleRestricted
        }
    }
});
